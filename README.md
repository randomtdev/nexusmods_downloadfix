# nexusmods_downloadfix
Userscript to fix the dumb new nexusmods update 

If you're here, chances are you're looking to get rid of the predatory dogshit download pop-up the nexus administration has shoved into your face recently.

You're in luck! I have used my meager javascript knowledge to develop a script that completely bypasses this nonsense.

I'm sure some of you want to nail me to a stake and burn me like a witch, but I really don't care.

## Endorse Mods! ##

People work quite a bit to deliver you the (probably)quality stuff you're using. The least you can do is press a button to let the mod developer know you enjoyed the mod.

## Download ##
You can install the script below with your userscript manager of choice. 

Options include:

* Greasemonkey ^[Firefox](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/), 
* Tampermonkey ^[Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)  ^[Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
* Violentmonkey ^[Chrome](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
  ^[Firefox](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)

I personally prefer Violentmonkey.

After installing an extension of your choice, you can go to the install link and well.. install the script. 

[Install](https://github.com/randomtdev/nexusmods_downloadfix/raw/master/nexusmods_downloadfix.user.js)

[Source](https://github.com/randomtdev/nexusmods_downloadfix)

### Updates ####

**1.2**

- Fixed an issue where the script wouldn't work for greasemonkey.
- Added auto-update urls; Might work, might not. 

**1.1**:

- Fix: The server now knows you've downloaded the file so you can endorse the mod and probably count towards statistics. Whoops.

## What this does ##
* Bypasses the redirect upon downloads that nags you to buy premium and forces you to wait 5 seconds if you don't.
* Removes Adblock banner
* Removes Vortex banner
* Removes premium nag banner on files page

## What this does **NOT** do ##

* Bypass the 1-2MB download speed restriction on non-premium users.
* Give you premium
* Make you cool
* Give you brownie points with admins

## How does it work ##

Basically what the script does behind the scenes is simply request the page the button would lead you to and grab the *real* download link for you, practically bypassing it for the user. 

This means no 5 second wait and no "PREMIUM BUY ME PLEASE".

# **Disclaimer** #

The script is in the end a roundabout way to bypass the redirect. The actual speed will depend on your connection and latency to the nexusmods servers among other factors. Sometimes preparing a download will take 5 seconds regardless. Still, you will skip the annoying redirects.

NOTE: If you are a premium user this script probably won't work for you. As you might have imagined, I'm not premium so I can't really check to know for sure.
