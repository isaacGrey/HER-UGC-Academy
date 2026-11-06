# HER design implementation

`HER-Design.md` was read in full before UI implementation and remains unchanged. Its design language takes precedence over the supplemental build brief.

| Authoritative rule                                | Implementation                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Light gray application background, white surfaces | Central `--background` and `--surface` tokens in `src/app/globals.css`                     |
| Purple/indigo primary actions and selected states | `--primary`, focus outlines, selected navigation, saved controls, chart accents            |
| Soft green/yellow status accents                  | Named success/warning tokens and textual pill status badges                                |
| Modern legible sans serif                         | Locally bundled Inter weights 400–800; no runtime font network request                     |
| Rounded white cards, soft shadows                 | Shared `.card`, 16px radius, subtle border and diffuse shadow                              |
| Moderate-radius primary/outlined buttons          | Shared 8px `.button` styles, hover/focus/disabled/pending states                           |
| Circular creator avatars                          | `Avatar` component with initials fallback; contained brand logo variant                    |
| Media thumbnails with rounded corners             | Private signed image URLs in consistently proportioned portfolio containers                |
| Discovery top navigation and persistent filters   | `Shell` marketplace mode and query-string filter panels; collapsible mobile filters        |
| Workspace sidebar and header                      | Shared role-specific navigation, native mobile drawer toggle, account controls             |
| Responsive discovery grids                        | Three columns on wide desktop, two at intermediate widths, one on mobile                   |
| Accessible centered modal/overlay                 | Native `dialog.showModal()` confirmation components with close, Escape, and focus handling |

Profile details use full pages, which the supplemental brief explicitly permits. Dangerous actions use confirmation dialogs. Data tables become cards on small screens; numeric analytics history stays in its own horizontal scrolling region. No user content is rendered as raw HTML. Motion respects `prefers-reduced-motion`.

The seed deliberately uses initials and fictional companies instead of impersonating creators or displaying invented API badges. Actual profile photos and portfolio images can be uploaded through the private storage flow.
