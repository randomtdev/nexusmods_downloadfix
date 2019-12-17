// ==UserScript==
// @name            Nexus Download Fix
// @description     Fixing the absolute dogshit new download system for nexusmods
// @namespace       randomtdev
// @include         *://www.nexusmods.com/*/mods/*?tab=files&file_id=*
// @include         *://www.nexusmods.com/*/mods/*
// @grant           none
// @version         1.3.1
// @author          randomtdev
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js
// @updateURL       https://gitcdn.xyz/repo/randomtdev/nexusmods_downloadfix/master/nexusmods_downloadfix.meta.js
// @downloadURL     https://gitcdn.xyz/repo/randomtdev/nexusmods_downloadfix/master/nexusmods_downloadfix.user.js
// @homepageURL     https://github.com/randomtdev/nexusmods_downloadfix
// @run-at			document-start
// ==/UserScript==

// This is a script to partially work around the fact that nexus has become some shitty third-rate download site with constant (shameless) "SLOW DOWNLOAD OR PREMIUM DOWNLOAD BUY ME PLEASE I'M BETTER" prompts That also of course make you wait 5 seconds and bug you to buy premium.
// Hopefully someone with better knowledge of the JS environment can make a better version of this; I'm not very experienced with JS or web development at all.

// Of course, this does not fix the rate limiting nor is it meant to, but it will skip the dumb 5 second wait that the admins seem to be jerking off to and basically completely restore the original experience.
// I had no issue with the rate limiting but this shit crosses the line for me. Instantly lost all of my respect for this site's administration as soon as I saw the god awful prompt you see on every garbage download site.
// Next thing you'll know we'll have a set amount of files we can download every couple of hours and speeds will be capped at 100KB and the user experience will get even worse


// Anyway, you guys make some shameless cash grab and I'll shamelessly bypass it and release it. Fuck you. Once this gets fixed I'll just bypass it again
this.$ = this.jQuery = jQuery.noConflict(true);

var patchedButtons = false

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
    var element = button.getElementsByTagName("span")[0]
    if (!element) {
        element = button
    }

    element.innerHTML = text
}

// Tell the server we've downloaded the mod so the user can endorse it and it counts towards the DL count (whoops)
function ActuallyDownloadTheMod(href) {
    var q2 = $("#section.modpage")
    if (q2.length > 0) // We only want to click endorse button if we haven't already endorsed the mod.
    {
        var section = q2[0]

        var gameId = section.getAttribute("data-game-id")
        var modId = section.getAttribute("data-mod-id")
        var fileId = href.substring(href.indexOf("&file_id=") + 9, href.length) // This should work consistently. Probably.

        console.log("Telling server we downloaded the mod", gameId, modId, fileId)

        // Was totally going to put an auto-endorse here but nexus only allows an endorse 15 minutes after download. welp
        $.ajax({
            type: "POST",
            url: "/Core/Libs/Common/Managers/Downloads?ConfirmFinishedDownload",
            data: {
                fid: fileId,
                game_id: gameId,
            },
            success: function () {
                $('a svg.icon-endorse').parent().removeClass('btn-inactive');
                $('a svg.icon-vote').parent().removeClass('btn-inactive');
            }
        });

    }
}

function PatchButton(button) {
    var link = button.getAttribute("href")
    //button.removeAttribute("href")
    button.addEventListener("click", function (e) {
        e.preventDefault()
        if (button.doingCache) {
            button.clickedIt = true
            return
        }

        console.log("Requesting download page", link)
        var originalText = GetButtonLabel(button)
        SetButtonLabel(button, "Downloading...")

        if (button.cachedLink) {
            window.location.href = button.cachedLink
            ActuallyDownloadTheMod(link)
            $('button.mfp-close').click()
            return
        }

        $.ajax({
            url: link,
            data: "",
            success: function (response) {
                var match = response.match(/data-download-url="(.*)"/)
                if (!match) {
                    alert("Download Failed! Are you logged in?")
                    SetButtonLabel(button, originalText)
                    return
                }
                console.log("Downloading ", match[1])
                window.location.href = match[1]

                if (button.requirements) {
                    $('button.mfp-close').click() // Close mod requirements popup
                } else {
                    SetButtonLabel(button, "Downloaded File!")
                    setTimeout(function () {
                        SetButtonLabel(button, originalText)
                    }, 5000)
                }
                ActuallyDownloadTheMod(link)
            }
        });
    })

    if (button.requirements && !button.doingCache && !button.cachedLink) // Chances are if you've clicked the download button you want to download this. Let's grab and cache the actual download link after it's been opened instead of once the 2nd download button is clicked.
    {
        var txt = GetButtonLabel(button)
        SetButtonLabel(button, "Preparing download...")
        button.doingCache = true
        console.log("Preparing download link for mod requirements popup. Requesting ", link)
        $.ajax({
            url: link,
            data: "",
            success: function (response) {
                button.doingCache = false

                var match = response.match(/data-download-url="(.*)"/)
                if (!match) {
                    alert("Download Failed! Are you logged in?")
                    SetButtonLabel(button, txt)
                    return
                }

                console.log("Cached real download link ", match[1])
                button.cachedLink = match[1]

                SetButtonLabel(button, txt)
                if (button.clickedIt) // If the user clicked the button before it was finished preparing, we'll just initiate the download instead of having them click again.
                {
                    console.log("User already clicked download button; Downloading ", button.cachedLink)
                    window.location.href = button.cachedLink
                    $('button.mfp-close').click()
                    ActuallyDownloadTheMod(link)
                }
            }
        });
    }

    button.patched = true
}

function PatchFixModRequirements(button) {
    if (!button.getAttribute("href").includes("ModRequirementsPopUp")) {
        return false
    }

    button.addEventListener("click", function (e) {
        var findDownload = setInterval(function () {
            var btn = $("a.btn:contains('Download')")
            if (btn.length > 0) {
                clearInterval(findDownload)
                btn[0].requirements = true
                PatchButton(btn[0])
            }
        }, 500)

    })

    return true
}

function PatchButtonBySpanText(text) {
    var q = $('a.btn span:contains("' + text + '")')
    if (q.length == 0 || q[0].patched) {
        return
    }
    
    var btn = q[0].parentNode

    // We don't want to patch this button if it just leads to the files page, because I guess that's a thing for multiple files.
    if (!PatchFixModRequirements(btn) && btn.getAttribute("href").indexOf("&file_id=") != -1) 
    {
        PatchButton(btn)
    }
    q[0].patched = true
    console.log("Patched", text, "button")
}

function PatchDownloadButtons() {
    if (document.URL.indexOf("?tab=files") == -1) // This is probably fine...
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

            // dumb way to get the download button that's created for mod requirements
            if (PatchFixModRequirements(button)) {
                continue
            }

            PatchButton(button)
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
                    if (PatchDownloadButtons()) {
                        console.log("We did dem button patches boi")
                        patchedButtons = true
                    } else {
                        console.error("Looks like we failed to do button patches without an exception some reason. No buttons?")
                    }
                }
            }, 100)
        } else {
            var original_post_load = window.post_load
            window.post_load = function () {
                original_post_load()
                console.log("postload")

                if ($('#mod_files').length > 0) { // Is this the files page?
                    console.log("Loaded new file page; Trying to patch download buttons")
                    if (PatchDownloadButtons()) {
                        console.log("We did dem button patches boi")
                        patchedButtons = true
                    } else {
                        console.error("Looks like we failed to do button patches without an exception some reason. No buttons?")
                    }
                }
                RemoveAdblockBanner()
            }

            if (document.URL.indexOf("?tab=files") > -1) // Do initial patches if we're loading the files page directly.
            {
                if (PatchDownloadButtons()) {
                    console.log("We did dem button patches boi")
                    patchedButtons = true
                } else {
                    console.error("Looks like we failed to do button patches without an exception some reason. No buttons?")
                }
                RemoveAdblockBanner()
            }
        }


        $("#rj-vortex").remove() // Nooooo not the 124px tall vortex banner!!! (like can you get any more obnoxious please)
        $(".agroup.clearfix").remove() // whoops there goes the ad banner
        console.log("Removed Vortex/Ad banners")


        return
    }
}
window.onload = Initialize
// This portion was here before I did the button patching; Leaving it here as a failsafe in case patching fails or bugs out.

var slowBtn = $('#slowDownloadButton')
var fastBtn = $('#fastDownloadButton')

// free shitty memes
slowBtn.children("span").text("BOO YOU SUCK");
fastBtn.children("span").text("BUY PREMIUM BRO");

var url = slowBtn.attr("data-download-url") // Get URL directly from attribute(lmao) instead of waiting 5 seconds(also lmao what has this website become)
if (!url) {
    return
}
window.location.href = url // Redirect to actual download link

// Log this download to console

var file = url.substring(0, url.indexOf("?md5="))
if (!file) {
    return
}
console.log("Downloading file ", url)

ActuallyDownloadTheMod(document.URL) // No clue if it actually works properly on this page; Don't feel like testing it right now