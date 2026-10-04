/**
 * Ad Poison — curated hosts-file groups.
 *
 * Hosts files can't do wildcards, so every hostname is listed explicitly.
 * `breaks` flags entries that commonly break something visible.
 * For whole-internet coverage use a maintained list (see hosts page).
 */
(function (global) {
  'use strict';

  var groups = [
    {
      id: 'google-ads', name: 'Google ads', on: true,
      note: 'DoubleClick, AdSense and ad-serving domains.',
      hosts: ['doubleclick.net', 'ad.doubleclick.net', 'googleads.g.doubleclick.net', 'stats.g.doubleclick.net', 'static.doubleclick.net', 'pagead2.googlesyndication.com', 'tpc.googlesyndication.com', 'googlesyndication.com', 'adservice.google.com', 'googletagservices.com', 'www.googletagservices.com']
    },
    {
      id: 'google-clicks', name: 'Google sponsored-link redirects', on: false, breaks: 'Clicking "Sponsored" results in Google Search will fail.',
      note: 'Conversion tracking on ad clicks.',
      hosts: ['googleadservices.com', 'www.googleadservices.com', 'partner.googleadservices.com']
    },
    {
      id: 'google-analytics', name: 'Google Analytics & Tag Manager', on: true, breaks: 'A few sites that gate content behind Tag Manager may misbehave.',
      note: 'Cross-site measurement scripts.',
      hosts: ['google-analytics.com', 'www.google-analytics.com', 'ssl.google-analytics.com', 'region1.google-analytics.com', 'googletagmanager.com', 'www.googletagmanager.com', 'app-measurement.com']
    },
    {
      id: 'meta', name: 'Meta (Facebook) pixel', on: true, breaks: '"Log in with Facebook" buttons and embedded posts on other sites.',
      note: 'The tracking pixel embedded across millions of sites.',
      hosts: ['connect.facebook.net', 'pixel.facebook.com', 'an.facebook.com']
    },
    {
      id: 'microsoft', name: 'Microsoft / LinkedIn ads', on: true,
      note: 'Bing UET tag, Clarity session recording, LinkedIn Insight tag.',
      hosts: ['bat.bing.com', 'clarity.ms', 'c.clarity.ms', 'www.clarity.ms', 'px.ads.linkedin.com', 'snap.licdn.com']
    },
    {
      id: 'amazon', name: 'Amazon ad system', on: true,
      note: 'Amazon ads served on third-party sites.',
      hosts: ['amazon-adsystem.com', 'aax.amazon-adsystem.com', 'c.amazon-adsystem.com', 's.amazon-adsystem.com', 'z-na.amazon-adsystem.com']
    },
    {
      id: 'social', name: 'TikTok, X, Pinterest, Snap pixels', on: true,
      note: 'Social-network conversion pixels on shopping sites.',
      hosts: ['analytics.tiktok.com', 'analytics.twitter.com', 'static.ads-twitter.com', 'ads-twitter.com', 'ct.pinterest.com', 'tr.snapchat.com', 'sc-static.net']
    },
    {
      id: 'exchanges', name: 'Ad exchanges & data brokers', on: true,
      note: 'Real-time bidding exchanges, retargeters and audience brokers.',
      hosts: ['adnxs.com', 'ib.adnxs.com', 'secure.adnxs.com', 'rubiconproject.com', 'fastlane.rubiconproject.com', 'pubmatic.com', 'ads.pubmatic.com', 'image6.pubmatic.com', 'openx.net', 'us-u.openx.net', 'criteo.com', 'criteo.net', 'static.criteo.net', 'dis.criteo.com', 'bidder.criteo.com', 'adsrvr.org', 'match.adsrvr.org', 'insight.adsrvr.org', 'casalemedia.com', 'dsum-sec.casalemedia.com', 'tlx.3lift.com', 'eb2.3lift.com', 'adform.net', 'track.adform.net', 'smartadserver.com', 'demdex.net', 'dpm.demdex.net', 'bluekai.com', 'tags.bluekai.com', 'krxd.net', 'quantserve.com', 'pixel.quantserve.com', 'scorecardresearch.com', 'sb.scorecardresearch.com', 'moatads.com', 'z.moatads.com']
    },
    {
      id: 'native', name: 'Native "around the web" ads', on: true, breaks: 'Recommended-article widgets on news sites disappear (that is the point).',
      note: 'Taboola and Outbrain clickbait grids.',
      hosts: ['taboola.com', 'cdn.taboola.com', 'trc.taboola.com', 'images.taboola.com', 'outbrain.com', 'widgets.outbrain.com', 'log.outbrain.com', 'amplify.outbrain.com']
    }
  ];

  global.AP = global.AP || {};
  global.AP.blocklists = groups;
})(window);
