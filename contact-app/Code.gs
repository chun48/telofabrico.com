function doGet() {
  return HtmlService.createHtmlOutputFromFile('Contact')
    .setTitle('Contacto de TE LO FABRICO')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function sendContact(fields) {
  const email = typeof fields?.email === 'string' ? fields.email.trim() : '';
  const message = typeof fields?.message === 'string' ? fields.message.trim() : '';
  const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_{}|~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

  if (!fields || fields.website !== '' || email.length > 254 ||
      !emailPattern.test(email) || !message || message.length > 3000) {
    return 'invalid';
  }

  const properties = PropertiesService.getScriptProperties();
  const recipient = properties.getProperty('CONTACT_RECIPIENT');
  if (!recipient) {
    return 'unavailable';
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) {
    return 'busy';
  }

  try {
    const cache = CacheService.getScriptCache();
    const windowKey = 'contact-minute-' + Math.floor(Date.now() / 60000);
    const recent = Number(cache.get(windowKey) || 0);
    if (recent >= 8 || MailApp.getRemainingDailyQuota() < 1) {
      return 'busy';
    }

    cache.put(windowKey, String(recent + 1), 120);
    MailApp.sendEmail({
      to: recipient,
      replyTo: email,
      subject: 'Nueva consulta de TE LO FABRICO',
      body: 'Correo de contacto: ' + email + '\n\n' + message
    });
    return 'sent';
  } catch (error) {
    return 'unavailable';
  } finally {
    lock.releaseLock();
  }
}
