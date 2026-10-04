# Ad Poison

## Purpose

To generate random traffic through browser or other methods to prevent intrusive and alarming personalized ad feeds to obfuscate your browsing. Attempts to reset

## Considerations

- We may want to provide ways to easily edit your hosts files with a copy-paste, referencing pihole block lists perhaps. 
- suggest private DNS services free or paid
- suggest regular hygeneie for browsers with instructions or if automated ways are possible
- suggest a flushdns method if it suits the purpose of this project 
- this could be a hard link https://myadcenter.google.com/personalizationoff?n=true

## Design

Vintage retro pixel 8-bit designs would be interesting. One site i used to use was https://www.webdesignmuseum.org/gallery/kaliber10000-2003
I like some of these references https://www.pinterest.com/ideas/8bit-website-design/945495886681/

A better theme/concept could be a sugar skull avatar somewhere between flappy bird and grim fandango. He can be animated using GSAP or css/js. Reference https://www.reddit.com/r/PixelArt/comments/hccej4/ive_been_experimenting_with_different_resolutions/#lightbox
https://www.reddit.com/r/PixelArt/comments/hddfoc/tried_to_breathe_some_life_into_this_esqueleto/


## Research

### Chaff

used to work as an extension but now disabled. There is a browser version we may reference.
- https://www.deploychaff.com/
- https://github.com/immutabledev/chaff
- https://chaff.en.softonic.com/chrome/extension?ex=RAMP-4839.0&rex=true

### More material

- https://www.reddit.com/r/coolguides/comments/1rfmmo3/a_cool_guide_to_disable_your_ad_id/
- https://amiunique.org/
- https://pixeldefence.com/delete-google-advertising-id-guide/
- https://nordvpn.com/blog/reset-advertising-id/
- https://myadcenter.google.com/home

## Technical

### Suggestions
A use of responsive css-grid and the framework can be angular, react, vue, next, vite. 


### Deliverables

A directory structure as follows.

```
Root
├── html
├── robots.txt (and similar)
├── index.js (if needed)
├── package.json (if needed)
├── package-lock.json (if needed)
├── README.md
└── assets
    ├── css
    ├── img
    ├── js
    └── utils
```

CSS and JS should be seperate files that could be referenced on future pages if this is a static site.

#### Features

We want to utilize advantages for SEO like schemas, sitemaps, webshare api, SEO/Opengraph/Twitter card, minimum WCAG.