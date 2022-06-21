import captchaSolver from '2captcha-node';

export class TwoCaptchaService {
  public static init(token: string) {
    return captchaSolver(token);
  }
}
