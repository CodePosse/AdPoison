/**
 * Ad Poison — data broker deletion letter generator.
 * Nothing typed here is stored or sent: the letter is built in the tab only.
 * Requires: assets/utils/helpers.js
 */
(function () {
  'use strict';

  var AP = window.AP;
  var root = document.getElementById('letter-builder');
  if (!root || !AP) return;

  function $(id) { return document.getElementById(id); }
  var lawSel = $('letter-law');
  var stateField = $('letter-state-field');
  var output = $('letter-output');
  var subjectEl = $('letter-subject');
  var mailto = $('letter-mailto');

  /* Per-law wording. {state} is replaced with the state the user typed. */
  var LAWS = {
    gdpr: {
      subject: 'Erasure and objection request under GDPR Articles 17 and 21',
      intro: 'I am writing to exercise my rights under the General Data Protection Regulation (EU) 2016/679 and, where applicable, the UK GDPR.',
      del: 'Erase all personal data you hold about me, under Article 17. You have no legitimate ground to keep it: I did not give you consent and I object to its processing.',
      sell: 'Stop processing my personal data for direct marketing, profiling and advertising, under Article 21(2) and (3), and do not sell, license or share it with anyone.',
      partners: 'Notify every recipient to whom you disclosed my personal data of this erasure, under Article 19, and tell me who they are.',
      source: 'Tell me the source of my personal data and the categories you hold, under Articles 14 and 15.',
      deadline: 'Please confirm completion within one month, as required by Article 12(3).',
      id: 'Under Article 12(6) you may only request additional information if you have reasonable doubts about my identity. The details above are sufficient to locate my records.'
    },
    ccpa: {
      subject: 'CCPA/CPRA request to delete and to opt out of sale and sharing',
      intro: 'I am a California resident exercising my rights under the California Consumer Privacy Act, as amended by the California Privacy Rights Act (Cal. Civ. Code § 1798.100 et seq.).',
      del: 'Delete all personal information you have collected about me, under § 1798.105, and direct your service providers and contractors to do the same.',
      sell: 'Do not sell or share my personal information, under § 1798.120, and limit the use of any sensitive personal information, under § 1798.121. This includes use for cross-context behavioral advertising.',
      partners: 'Notify all third parties to whom you sold or shared my personal information of this request.',
      source: 'Disclose the categories and specific pieces of personal information you hold, the sources, and the third parties you shared it with, under §§ 1798.110 and 1798.115.',
      deadline: 'Please confirm completion within 45 days, as required by § 1798.130. If you are a registered data broker, please also process this request through the Delete Request and Opt-out Platform (DROP).',
      id: 'An opt-out of sale or sharing does not require identity verification. Please use only the details above to locate my records and do not ask for more information than is necessary.'
    },
    us: {
      subject: 'Consumer privacy request to delete and to opt out ({state})',
      intro: 'I am a resident of {state} and am exercising my rights under the {state} consumer data privacy law.',
      del: 'Delete all personal data you have collected about me or obtained about me from other sources.',
      sell: 'Opt me out of the sale of my personal data, its processing for targeted advertising, and profiling in furtherance of decisions that produce legal or similarly significant effects.',
      partners: 'Notify the third parties to whom you sold or disclosed my personal data of this request.',
      source: 'Confirm whether you process my personal data and provide me with a copy of it.',
      deadline: 'Please confirm completion within 45 days, as the law requires.',
      id: 'Please use only the details above to locate my records and do not ask for more information than is necessary to process this request.'
    },
    generic: {
      subject: 'Request to delete my personal data and stop selling it',
      intro: 'I am writing to request that you stop processing my personal data. I never agreed to you collecting, selling or publishing it.',
      del: 'Delete all personal data you hold about me, including any public listing or profile.',
      sell: 'Stop selling, licensing or sharing my personal data, and stop using it for advertising or profiling.',
      partners: 'Ask any company you sold or shared my data with to delete it too.',
      source: 'Tell me where you obtained my data.',
      deadline: 'Please confirm in writing within 30 days that this has been done.',
      id: 'Please use only the details above to locate my records.'
    }
  };

  function val(id) { return $(id).value.trim(); }

  function build() {
    var law = LAWS[lawSel.value];
    var isUS = lawSel.value === 'us';
    stateField.hidden = !isUS;
    var state = val('letter-state') || '[your state]';
    function fill(s) { return s.replace(/\{state\}/g, state); }

    var name = val('letter-name') || '[Your full name]';
    var email = val('letter-email') || '[your email]';
    var company = val('letter-company');
    var ids = $('letter-ids').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);

    var asks = [];
    if ($('ask-delete').checked) asks.push(law.del);
    if ($('ask-sell').checked) asks.push(law.sell);
    if ($('ask-partners').checked) asks.push(law.partners);
    if ($('ask-source').checked) asks.push(law.source);
    if ($('ask-delete').checked || $('ask-sell').checked) {
      asks.push('Suppress my details so they are not collected or listed again in future.');
    }

    var lines = [
      'To ' + (company ? 'the privacy team at ' + company : 'whom it may concern') + ',',
      '',
      fill(law.intro),
      '',
      'Please:'
    ];
    asks.forEach(function (a, i) { lines.push((i + 1) + '. ' + fill(a)); });
    lines.push('', 'Details to locate my records:', '- Name: ' + name, '- Email: ' + email);
    ids.forEach(function (s) { lines.push('- ' + s); });
    lines.push(
      '',
      fill(law.id),
      '',
      fill(law.deadline),
      '',
      'Sincerely,',
      name,
      new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    );

    var subject = fill(law.subject);
    var body = lines.join('\n');
    subjectEl.value = subject;
    output.value = body;
    mailto.href = 'mailto:' + encodeURIComponent(val('letter-to')).replace(/%40/g, '@') +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  root.addEventListener('input', build);
  root.addEventListener('change', build);

  $('letter-download').addEventListener('click', function () {
    AP.download('deletion-request.txt', 'Subject: ' + subjectEl.value + '\n\n' + output.value);
    AP.toast('Downloaded deletion-request.txt');
  });

  build();
})();
