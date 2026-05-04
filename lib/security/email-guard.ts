// Anti-abuse helpers for trial signup. Two layers:
//   1. Block known disposable/temp-mail domains
//   2. Normalize gmail aliases (dots, +tags) so the same person can't take multiple trials
//
// Both are best-effort. Determined attackers can use a domain we don't know about,
// or a non-Gmail address. The point is to stop opportunistic abuse with zero
// friction for legitimate users.

const DISPOSABLE_DOMAINS = new Set<string>([
  // top throwaway/temp-mail services we've seen abuse from + the well-known ones
  "0-mail.com", "0clickemail.com", "10minutemail.com", "10minutemail.net",
  "20minutemail.com", "30minutemail.com", "33mail.com",
  "anonbox.net", "anonymbox.com", "armyspy.com",
  "bccto.me", "binkmail.com", "bobmail.info", "bsnow.net", "bugmenot.com",
  "burnermail.io", "byom.de",
  "cetpass.com", "chacuo.net", "cool.fr.nf", "courriel.fr.nf", "courrieltemporaire.com",
  "cuvox.de",
  "dayrep.com", "deadaddress.com", "despam.it", "discard.email",
  "discardmail.com", "discardmail.de", "disposable.com", "dispostable.com",
  "dodgeit.com", "dodgit.com", "dontreg.com", "dontsendmespam.de",
  "dropmail.me",
  "easytrashmail.com", "einrot.com", "emailias.com", "emailondeck.com", "emailtemporanea.com",
  "emailtemporanea.net", "emailwarden.com",
  "fakeinbox.com", "fakemailgenerator.com", "fast-mail.org", "filzmail.com",
  "front14.org", "fudgerub.com",
  "garliclife.com", "get1mail.com", "getairmail.com", "getmail.ro", "getnada.com",
  "ghosttexter.de", "guerrillamail.biz", "guerrillamail.com", "guerrillamail.de",
  "guerrillamail.info", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
  "harakirimail.com",
  "incognitomail.org", "instant-mail.de", "ipoo.org",
  "jetable.com", "jetable.fr.nf", "jetable.net", "jetable.org",
  "kasmail.com", "kaspop.com", "killmail.com", "kurzepost.de",
  "lifebyfood.com", "link2mail.net",
  "mail-temporaire.com", "mail-temporaire.fr", "mail.bccto.me", "mail.fai.com.br",
  "mail4trash.com", "mail4u.in", "mailcatch.com", "maildrop.cc", "maileater.com",
  "maileimer.de", "mailexpire.com", "mailfirst.org", "mailforspam.com", "mailfreeonline.com",
  "mailguard.me", "mailimate.com", "mailin8r.com", "mailinator.com", "mailinator.net",
  "mailinator.org", "mailinator2.com", "mailme.lv", "mailme24.com", "mailmetrash.com",
  "mailmoat.com", "mailms.com", "mailnesia.com", "mailnull.com", "mailshell.com",
  "mailsiphon.com", "mailtemp.info", "mailtothis.com", "mailtrash.net", "mailzilla.com",
  "mailzilla.org", "makemetheking.com", "manybrain.com", "meltmail.com", "mintemail.com",
  "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf", "msa.minsmail.com", "mt2009.com",
  "mt2014.com", "mt2015.com", "mvrht.com", "mytemp.email", "mytempemail.com", "mytrashmail.com",
  "neomailbox.com", "no-spam.ws", "nobulk.com", "noclickemail.com", "nogmailspam.info",
  "nomail.xl.cx", "nomail2me.com", "nospam.ze.tc", "nospamfor.us", "nospamthanks.info",
  "notmailinator.com", "nowmymail.com",
  "objectmail.com", "obobbo.com", "onewaymail.com", "ordinaryamerican.net", "otherinbox.com",
  "ovpn.to",
  "pmdeal.com", "poofy.org", "pookmail.com", "privacy.net", "privatdemail.net", "proxymail.eu",
  "punkass.com", "putthisinyourspamdatabase.com",
  "quickinbox.com",
  "rcpt.at", "recode.me", "recursor.net", "regbypass.com", "regbypass.comsafe-mail.net",
  "rhyta.com", "rmqkr.net",
  "safe-mail.net", "sandelf.de", "saynotospams.com", "schafmail.de", "selfdestructingmail.com",
  "selfdestructingmail.org", "send-email.org", "sendspamhere.com", "sharklasers.com",
  "shieldedmail.com", "shieldemail.com", "shitmail.me", "shortmail.net", "sify.com",
  "sneakemail.com", "snkmail.com", "sofimail.com", "sofort-mail.de", "sogetthis.com",
  "soodonims.com", "spam.la", "spam4.me", "spamavert.com", "spambob.com", "spambob.net",
  "spambob.org", "spambog.com", "spambog.de", "spambog.net", "spambog.ru", "spambox.us",
  "spamcero.com", "spamcorptastic.com", "spamcowboy.com", "spamcowboy.net", "spamcowboy.org",
  "spamday.com", "spamex.com", "spamfree24.com", "spamfree24.de", "spamfree24.eu",
  "spamfree24.info", "spamfree24.net", "spamfree24.org", "spamgourmet.com", "spamgourmet.net",
  "spamgourmet.org", "spamherelots.com", "spamhereplease.com", "spamhole.com", "spamify.com",
  "spaminator.de", "spamkill.info", "spaml.com", "spaml.de", "spammotel.com", "spamobox.com",
  "spamoff.de", "spamslicer.com", "spamspot.com", "spamthis.co.uk", "spamthisplease.com",
  "spamtrail.com", "speed.1s.fr", "stuffmail.de", "supergreatmail.com", "supermailer.jp",
  "suremail.info",
  "teleworm.com", "teleworm.us", "temp-mail.org", "temp-mail.ru", "tempemail.biz",
  "tempemail.com", "tempemail.net", "tempinbox.co.uk", "tempinbox.com", "tempmail.eu",
  "tempmail.it", "tempmaildemo.com", "tempmailer.com", "tempmailer.de", "tempomail.fr",
  "temporarily.de", "temporarioemail.com.br", "temporaryemail.net", "temporaryforwarding.com",
  "temporaryinbox.com", "temporarymailaddress.com", "tempymail.com", "thankyou2010.com",
  "thisisnotmyrealemail.com", "throwawayemailaddress.com", "throwawaymail.com",
  "trash-amil.com", "trash-mail.at", "trash-mail.com", "trash-mail.de", "trash2009.com",
  "trashemail.de", "trashmail.at", "trashmail.com", "trashmail.de", "trashmail.me",
  "trashmail.net", "trashmail.org", "trashmail.ws", "trashmailer.com", "trashymail.com",
  "trbvm.com", "trillianpro.com", "tyldd.com",
  "uggsrock.com",
  "veryrealemail.com",
  "wegwerfemail.com", "wegwerfemail.de", "wegwerfemailadresse.com", "wegwerfmail.de",
  "wegwerfmail.info", "wegwerfmail.net", "wegwerfmail.org", "wh4f.org", "whyspam.me",
  "willhackforfood.biz", "willselfdestruct.com", "winemaven.info", "writeme.us",
  "yopmail.com", "yopmail.fr", "yopmail.net",
  "zehnminutenmail.de", "zoemail.org",
]);

export function getEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

// Gmail (and Googlemail) treat dots in the local part as identical, and
// everything after a "+" is an alias. john.doe+anything@gmail.com is the same
// inbox as johndoe@gmail.com. We normalize so the same person can't take a
// trial twice via these tricks.
//
// For non-gmail addresses we lowercase the whole thing (case insensitive) but
// keep the local part as-is.
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return trimmed;
  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plus = local.indexOf("+");
    if (plus >= 0) local = local.slice(0, plus);
    local = local.replace(/\./g, "");
    return `${local}@gmail.com`;
  }

  // Strip + alias for everything else too — most providers honor it
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  return `${local}@${domain}`;
}
