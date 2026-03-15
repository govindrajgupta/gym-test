import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiExcludeController()
@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('callback')
  handleCallback(@Res() res: Response) {
    const expoHost = this.configService.get<string>('EXPO_HOST') ?? 'localhost:8081';

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
    );
    res.send(`<!DOCTYPE html>
<html>
<head><title>Signing in...</title></head>
<body>
<p>Signing in, please wait...</p>
<script>
  var hash = window.location.hash;
  if (hash) {
    window.location.href = 'exp://${expoHost}/--/auth-callback' + hash;
  } else {
    document.body.innerHTML = '<p>Authentication failed. Please close this window and try again.</p>';
  }
</script>
</body>
</html>`);
  }
}
