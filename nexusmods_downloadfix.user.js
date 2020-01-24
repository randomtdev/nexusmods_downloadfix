// ==UserScript==
// @name            Nexus Download Fix
// @description     Fixing the dumb new download system for nexusmods
// @namespace       randomtdev
// @include         *://www.nexusmods.com/*/mods/*?tab=files&file_id=*
// @include         *://www.nexusmods.com/*/mods/*
// @grant           none
// @version         1.4
// @author          randomtdev
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js
// @updateURL       https://gitcdn.xyz/repo/randomtdev/nexusmods_downloadfix/master/nexusmods_downloadfix.meta.js
// @downloadURL     https://gitcdn.xyz/repo/randomtdev/nexusmods_downloadfix/master/nexusmods_downloadfix.user.js
// @homepageURL     https://github.com/randomtdev/nexusmods_downloadfix
// @run-at			document-start
// ==/UserScript==

// This is a script to partially work around the fact that nexus has become some shitty third-rate download site with constant (shameless) "SLOW DOWNLOAD OR PREMIUM DOWNLOAD BUY ME PLEASE I'M BETTER" prompts that also of course make you wait 5 seconds and bug you to buy premium.

/* Update 1.4 (2020-01-24)

   Hey me; It's you, 1 month later! It's 2020 now. A new update a couple days ago by the nexus staff broke the script, under the pretense that the script didn't tell nexus it downloaded the file.
   This is partially true, as the first versions of the script did not do this. This was fixed shortly after though. The latest version of the script did in fact do this.
   I'm unsure if there's concern over said outdated version of the script or if it's just bullshit, but in any case it's basically a given in this version (1.4)
   The change they made actually makes it significantly easier and faster for the script, essentially completely restoring the original experience of the site(for manual downloads). 
   The post in question; https://old.reddit.com/r/skyrimmods/comments/ernl7e/is_anybody_else_unable_to_manually_download_files/ff563z6/
   In case it gets deleted; https://i.imgur.com/Vovlf73.png

   Thanks to the guys on github issue reporting for the reddit link & error report
*/
this.$ = this.jQuery = jQuery.noConflict(true);

var patchedButtons = false
//var currentUrlParams = new URLSearchParams(new URL(document.URL))

function GetDownloadButtons() {
    // nice one m8, real genius right here
    return $('a.btn.inline-flex > span:contains("download")')
}

function GetButtonLabel(button) {
    var element = button.getElementsByTagName("span")[0]
    if (!element) {
        element = button
    }

    return element.innerHTML
}

function SetButtonLabel(button, text) {
    if (!button) 
    {
        return
    }

    var element = button.getElementsByTagName("span")[0]
    if (!element) {
        element = button
    }

    element.innerHTML = text
}

function DownloadFile(href, button)
{
    console.log("Attempting to download file from link", href)

    var q = $("#section.modpage")
    if (q.length > 0)
    {
        var section = q[0]
        var params = new URLSearchParams(new URL(href, document.URL).search)
        var gameId = section.getAttribute("data-game-id")
        var fileId = params.get("file_id") || params.get("id")

        if (params.get("nmm"))
        {
            console.log("Requesting premium page to get NXM protocol link")
            var originalText = GetButtonLabel(button)

            SetButtonLabel(button, "Getting link...")
            $.ajax({
                url: href,
                data: "",
                success: function (response) {
                    var match = response.match(/data-download-url="(.*)"/)
                    if (!match) {
                        alert("Download Failed! Are you logged in?")
                        SetButtonLabel(button, originalText)
                        return
                    }
                    console.log("Got nxm link ", match[1])
                    window.location.href = match[1]
    
                    $('button.mfp-close').click() // Close mod requirements popup if any

                    SetButtonLabel(button, "Got link!")

                    setTimeout(function () {
                        SetButtonLabel(button, originalText)
                    }, 5000)
                }
            });
        }
        else
        {
            console.log("Requesting download URL for file", fileId, "with game ID", gameId)

            // Guess I wont complain if we have this, and I certainly won't point out any issues with them doing this. Nope. Not at all. No issues here.
            $.ajax(
                {
                    type: "POST",
                    url: "/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl",
                    data: {
                        fid: fileId,
                        game_id: gameId,
                    },
                    success: function (data) {
                        if (data && data.url) {
                            window.location.href = data.url;
                            $('button.mfp-close').click() // Close mod requirements popup if any

                            // This is pretty pointless because you can't use them, but whatever.
                            $('a svg.icon-endorse').parent().removeClass('btn-inactive');
                            $('a svg.icon-vote').parent().removeClass('btn-inactive');
                        } else {
                            alert("Download Failed! Request went through, but couldn't get URL.\n\nAre you logged in?")
                            console.error("GenerateDownloadUrl failed; Got data ", data)
                        }
                    },
                    error: function () {
                        console.error("Download request failed for file", fileId)
                        alert("Download request failed!")
                    }
                }
            );
        }

    }
    else
    {
        console.error("uhhh is the page loaded yet?")
    }
}

function PatchButton(button) {
    var link = button.getAttribute("href")

    if (link.includes("ModRequirementsPopUp"))
    {
        button.requirements = true
    }
    
    button.addEventListener("click", function (e) {
        if (button.popup && button.downloaded)
        {
            return
        }

        if (button.requirements)
        {
            var findDownload = setInterval(function () {
                var btn = $("a.btn:contains('Download')")
                if (btn.length > 0) {
                    console.log("patching popup download btn")
                    clearInterval(findDownload)
                    btn[0].popup = true
                    PatchButton(btn[0])
                }
            }, 300)
        }
        else
        {
            e.preventDefault()

            DownloadFile(link, button)
            button.downloaded = true
        }

    })

    button.patched = true
    //console.log("patched", button)
}

function IsDownloadButton(button)
{
    var params = new URLSearchParams(new URL(button.getAttribute("href"), document.URL).search)
    return params.get("file_id") || (params.get("id") && params.get("game_id"))
}

function PatchButtonBySpanText(text) {
    var q = $('a.btn span:contains("' + text + '")')
    if (q.length == 0 || q[0].patched) {
        return
    }
    
    var btn = q[0].parentNode
    // We don't want to patch this button if it just leads to the files page, because I guess that's a thing for mods with multiple main files.
    if (IsDownloadButton(btn)) 
    {
        PatchButton(btn)
    }
    q[0].patched = true
    console.log("Patched", text, "button")
}

function PatchDownloadButtons() {
    if (document.URL.indexOf("?tab=files") == -1)
    {
        return false
    }

    var count = 0
    var buttons = GetDownloadButtons()
    if (buttons.length == 0) {
        return false
    }

    for (var i = 0; i < buttons.length; i++) {
        var span = buttons[i]
        if (span && span.parentNode) {
            var button = span.parentNode

            if (button.patched) {
                continue
            }
            //console.log(button)

            if (IsDownloadButton(button))
            {
                PatchButton(button)
            }
            
        }
    }


    return true
}

function RemoveAdblockBanner() {
    if ($(".premium-banner").remove().length > 0) // oh no not the premium banner
    {
        console.log("Removed premium nag banner")
    }
}

function InitializePatches()
{
    if (PatchDownloadButtons()) {
        console.log("We did dem button patches boi")
        patchedButtons = true
    } else {
        console.error("Looks like we failed to do button patches without an exception some reason. No buttons?")
    }
}

function Initialize() {
    if (document.URL.indexOf("&file_id=") == -1) // Is this NOT the download page?
    {
        PatchButtonBySpanText("Manual")
        PatchButtonBySpanText("Vortex")

        // After a new page is loaded, patch download buttons if the file tab exists.
        // Pretty hacky but it works better than what I was doing before (never again)

        console.log("patching postload (won't work on greasemonkey)", window.post_load)
        if (!window.post_load) // oh god why no please
        {
            console.log("post_load func not found; using fallback")
            setInterval(function () {
                var q = $("#mod_files")
                if (q.length > 0 && !q[0].patched) {
                    var page = q[0]
                    q[0].patched = true

                    console.log("postload fallback")
                    console.log("Loaded new file page; Trying to patch download buttons")
                    InitializePatches()
                }
            }, 100)
        } else {
            var original_post_load = window.post_load
            window.post_load = function () {
                original_post_load()
                console.log("postload")

                if ($('#mod_files').length > 0) { // Is this the files page?
                    console.log("Loaded new file page; Trying to patch download buttons")
                    InitializePatches()
                }
                RemoveAdblockBanner()
            }

            if (document.URL.indexOf("?tab=files") > -1) // Do initial patches if we're loading the files page directly.
            {
                InitializePatches()
                RemoveAdblockBanner()
            }
        }

        return
    }
    else
    {
        // This portion was here before I did the button patching; Leaving it here as a failsafe in case patching fails or bugs out.
        // Cleaned up and adapted for new workaround.
        var slowBtn = $('#slowDownloadButton')
        var fastBtn = $('#fastDownloadButton')

        // free shitty memes
        slowBtn.children("span").text("BOO YOU SUCK");
        fastBtn.children("span").text("BUY PREMIUM BRO");

        console.log("Downloading file")

        DownloadFile(document.URL) // No clue if it actually works properly on this page; Don't feel like testing it right now
    }
}
window.onload = Initialize

