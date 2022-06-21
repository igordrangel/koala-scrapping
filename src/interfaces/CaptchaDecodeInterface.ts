export interface CaptchaDecodeInterface {
  typeDecode: 'v1' | 'v2';
  enterprise: '2Captcha';
  xPathIframeImage?: string;
  xPathKey?: string;
  xPathUrl?: string;
  xPathInputCaptcha?: string;
  idTextArea?: string;
  xPathError?: string;
  mensagemError?: string;
  dataS?: string;
  xPathTradeImage?: string;
}
