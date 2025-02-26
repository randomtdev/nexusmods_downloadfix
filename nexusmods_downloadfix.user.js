// ==UserScript==
// @name            Nexus Download Fix
// @description     Bypass premium nag screen for downloads on nexusmods.
// @namespace       randomtdev
// @include         *://www.nexusmods.com/*/mods/*?tab=files&file_id=*
// @include         *://www.nexusmods.com/*/mods/*
// @grant           none
// @version         1.6.1
// @author          randomtdev
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js
// @homepageURL     https://github.com/randomtdev/nexusmods_downloadfix
// @run-at			    document-start
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

function GetDownloadButtons() {
    return $('a.btn.inline-flex[data-tracking*="Download"]')
}

function GetButtonLabel(button) {
    if (!button)
    {
        return
    }
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

    let oldText = element.innerHTML
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

        var originalText = GetButtonLabel(button)
        if (params.get("nmm"))
        {
            console.log("Requesting premium page to get NXM protocol link")
            SetButtonLabel(button, "Getting link...")

            $.ajax({
                url: href,
                data: "",
                success: function (response) {
                    var prem = false
                    var match = response.match(/data-download-url="(.*)"/)
                    // Premium
                    if (!match) {
                      match = response.match(/id="dl_link" value="(.*)"/)
                      prem = true
                    }

                    if (!match) {
                        DisplayPopup("DownloadFix script error", "Download Failed! Are you logged in?")
                        SetButtonLabel(button, originalText)
                        return
                    }

                    // URL Param symbols in the html are escaping for some reason when they weren't before, so this is a hack to fix that.
                    var url = match[1].replaceAll(";", "&")

                    console.log("Got nxm link ", url)
                    window.location.href = url

                  if (prem) {
                      $.magnificPopup.close();
                    }

                    SetButtonLabel(button, "Got link!")

                    setTimeout(function () {
                        SetButtonLabel(button, originalText)
                        if (button)
                            button.downloading = false
                    }, 5000)
                    ClosePopUp() // Close mod requirements popup if any
                }
            });
        }
        else
        {
            console.log("Requesting download URL for file", fileId, "with game ID", gameId)

            SetButtonLabel(button, "Getting link...")
            $.ajax(
                {
                    type: "POST",
                    url: "/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl",
                    data: {
                        fid: fileId,
                        game_id: gameId,
                    },
                    success: function (data) {
                        if (button)
                        {
                            button.downloading = false
                            SetButtonLabel(button, originalText)
                        }

                        if (data && data.url) {
                            window.location.href = data.url;

                            // This is pretty pointless because you can't use them, but whatever.
                            $('a svg.icon-endorse').parent().removeClass('btn-inactive');
                            $('a svg.icon-vote').parent().removeClass('btn-inactive');
                            $.magnificPopup.close();

                            ClosePopUp() // Close mod requirements popup if any
                        } else {
                            console.error("GenerateDownloadUrl failed; Got data ", data)
                            DisplayPopup("DownloadFix script error", "Download Failed! Request went through, but couldn't get URL.\n\nAre you logged in?")
                        }
                    },
                    error: function (_, s, e) {
                        if (button)
                        {
                            button.downloading = false
                            SetButtonLabel(button, originalText)
                        }

                        console.error("Download request failed for file", fileId, s, e)
                        DisplayPopup("DownloadFix script error", "Download request failed!")
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

    if (!link)
    {
      console.log("btn has no href")
      return false
    }

    if (link.includes("ModRequirementsPopUp") || link.includes("download-top-left-panel"))
    {
        return false
    }

    button.addEventListener("click", function (e) {
        e.preventDefault()

        if (!button.downloading) // Make sure we're not sending more requests while downloading; Won't work anyway.
        {
            button.downloading = true
            DownloadFile(link, button)
        }

    })

    button.patched = true
    return true
}

function IsDownloadButton(button)
{
    var params = new URLSearchParams(new URL(button.getAttribute("href"), document.URL).search)
    return params.get("file_id") || (params.get("id") && params.get("game_id"))
}

function PatchDownloadButtons() {
    /*if (document.URL.indexOf("?tab=files") == -1)
    {
        return false
    }*/

    var count = 0
    var buttons = GetDownloadButtons()
    if (buttons.length == 0) {
        return false
    }

    for (var i = 0; i < buttons.length; i++) {
        var btn = buttons[i]
        if (btn) {
            if (btn.patched) {
                continue
            }

            if (IsDownloadButton(btn))
            {
                PatchButton(btn)
                count++;
            }

        }
    }

    console.log("Patched", count, "download buttons")
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
    if (!PatchDownloadButtons()) {
        console.error("Looks like we failed to do button patches without an exception some reason. No buttons?")
    }
}

function Initialize() {
    if (document.URL.indexOf("&file_id=") == -1) // Is this NOT the download page?
    {
        InitializePatches()
        RemoveAdblockBanner()

        window.jQuery(document).ajaxComplete(function (e, request, settings) {
            if (settings.url.indexOf("ModFilesTab") != -1) // Was the files tab just loaded?
            {
                InitializePatches() // re-do button patches then
                RemoveAdblockBanner()
            }

            if (settings.url.indexOf("ModRequirementsPopUp") != -1) // Patch any popup download buttons
            {
                let btn = $(".widget-mod-requirements > a")
                if (btn)
                {
                    //btn.css('background-color', '#EB8E01');
                    PatchButton(btn[0])
                    console.log("Patched popup button")
                }
            }

        })

        /*if (document.URL.indexOf("?tab=files") > -1) // Do initial patches if we're loading the files page directly.
        {
            InitializePatches()
            RemoveAdblockBanner()
        }*/

        return
    }
    else
    {
        // This portion was here before I did the button patching; Leaving it here as a failsafe in case patching fails or bugs out.
        // Cleaned up and adapted for new workaround.
        var slowBtn = $('#slowDownloadButton')
        var fastBtn = $('#fastDownloadButton')

        console.log("Downloading file")

        DownloadFile(document.URL) // Auto download in case this page comes up
    }
}
window.onload = Initialize
