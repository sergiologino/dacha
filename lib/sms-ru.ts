interface SmsRuSendParams {
  phone: string;
  message: string;
}

interface SmsRuResponse {
  status?: string;
  status_text?: string;
  status_code?: number;
  sms?: Record<
    string,
    {
      status?: string;
      status_text?: string;
      status_code?: number;
      sms_id?: string;
    }
  >;
}

export interface SmsSendResult {
  providerMessageId?: string;
}

export async function sendSmsRuMessage({
  phone,
  message,
}: SmsRuSendParams): Promise<SmsSendResult> {
  const apiId = process.env.SMS_RU_API_ID;

  if (!apiId) {
    throw new Error("Не задан SMS_RU_API_ID.");
  }

  const body = new URLSearchParams({
    api_id: apiId,
    to: phone,
    msg: message,
    json: "1",
  });

  if (process.env.SMS_RU_FROM) {
    body.set("from", process.env.SMS_RU_FROM);
  }

  if (process.env.SMS_RU_TEST === "1") {
    body.set("test", "1");
  }

  const response = await fetch("https://sms.ru/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SMS.ru вернул HTTP ${response.status}.`);
  }

  const data = (await response.json()) as SmsRuResponse;

  if (data.status !== "OK") {
    throw new Error(data.status_text || "SMS.ru не принял запрос.");
  }

  const smsResult = data.sms?.[phone];

  if (!smsResult || smsResult.status !== "OK") {
    throw new Error(smsResult?.status_text || "SMS.ru не отправил код.");
  }

  return {
    providerMessageId: smsResult.sms_id,
  };
}
