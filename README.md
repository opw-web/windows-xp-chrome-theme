# Luna Chrome

A permission-free Google Chrome theme tuned to the Windows XP Blue appearance
in the Seelen UI reference. The optional Luna New Tab extension adds a classic
Google search panel and editable shortcuts over Bliss.

## Restore the approved 0.3 theme

Check out tag `v0.3.0` in a separate clone or download its source. Reset your
current Chrome theme in **Settings → Appearance**, then load the tagged
`theme` folder as an unpacked theme.

## Install, update, or remove

1. If the prototype is already installed, open `chrome://settings/appearance`
   and use **Reset to default** under **Theme** to clear its cached artwork.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Select **Load unpacked** and choose this project's `theme` folder.
4. To remove the theme, return to **Settings → Appearance → Theme** and use
   **Reset to default**.

Chrome can give a separately chosen New Tab background priority over the one
bundled in a theme. If Bliss is missing, clear that background in **Customize Chrome**
and open a new tab.

[Chrome's unpacked installation instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
and [theme removal instructions](https://support.google.com/chrome_webstore/answer/148695).

## Use the Windows XP New Tab page

1. Run `.\build_new_tab.ps1` in PowerShell from this
   folder. This assembles a loadable extension in `dist/new-tab` with the
   existing wallpaper.
2. Open `chrome://extensions`, enable **Developer mode**, and use **Load
   unpacked** on `dist/new-tab`. Open a new tab and choose **Keep it** if Chrome
   asks whether to keep the changed New Tab page.
3. Use **Manage shortcuts → Import** to open your local export, or **Add
   shortcut** to enter sites individually. The edit button on each shortcut
   lets you rename it, change its address, move it, or remove it.

The extension asks only for local shortcut storage. Search goes straight to
Google when you submit the form. Import appends new addresses in file order and
skips existing addresses. Export makes a portable JSON file with names and URLs.
Keep personal exports outside Git. Disabling Luna New Tab in
`chrome://extensions` brings back Chrome's built-in New Tab and its shortcuts.
Export before removing the extension if you want to keep the redesigned page's
shortcut list.

## How the theme works

| Surface | Treatment |
| --- | --- |
| Frame and inactive tabs | Glossy royal blue sampled from the Seelen reference. The tab textures use frame blue where the tab outline curves and a beveled face across the straighter middle. Unfocused windows use a quieter blue. |
| Selected tab and toolbar | The shared texture paints a pale rectangular-looking face on the selected tab. Frame blue masks its curved shoulders in the focused window. A separate icy band starts the toolbar. |
| Window controls | Windows Chrome samples a three-slot PNG for compact blue minimize and maximize plates and a red close plate. The plates are positioned behind Chrome's own symbols. |
| New tab button | A wider band of matching blue blends the native plus button into the tab strip at rest. Chrome controls its shape and interaction states. |
| Address bar | The manifest requests a white field and dark-blue text. Chrome computes the appearance of the interaction states. |
| New Tab | A centered, full-color photo behind Chrome's standard controls. Chrome displays a theme PNG at its native size and crops it to the window. The bundled image is sized for desktop use, including the reference display at 200% scale. |

Chrome controls the radius of tabs and the omnibox as well as the layout, glyphs,
hit targets, dragging, and security UI. Luna Chrome creates the raised effect with
straight highlights and shading within Chrome's paintable areas.

[Chrome theme reference](https://developer.chrome.com/docs/extensions/develop/ui/themes),
[Chromium tab painting](https://chromium.googlesource.com/chromium/src/+/ca0889d298353d69b923461e06db66f88cb02048/chrome/browser/ui/views/tabs/tab_style_views.cc),
and [Chromium Windows caption painting](https://raw.githubusercontent.com/chromium/chromium/6dc9bc3bdaea5c35ed6d41fceab2f7a3a2227c4f/chrome/browser/ui/views/frame/windows_caption_button.cc).

## Regenerate the artwork

The images are bundled. With Python 3, use `python .\build_assets.py` to rebuild
the frame, tab, toolbar, window-control, and extension icon PNGs. Edit the RGB
stops in the script to adjust the gradients.

To rebuild the wallpaper PNG from your own local source, run this command from
PowerShell. The script scales the photo to 1920 pixels wide and keeps its proportions.

```powershell
.\build_wallpaper.ps1 -SourceImage 'C:\path\to\bliss.jpg'
```

Reset the theme and load the folder again after changing any PNG.
