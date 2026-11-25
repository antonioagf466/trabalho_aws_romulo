
const crypto = require('crypto');

function compararSeguro(valor1, valor2) {
  const a = Buffer.from(String(valor1));
  const b = Buffer.from(String(valor2));

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function gerarToken(usuario) {
  const payload = {
    sub: usuario,
    exp: Date.now() + 8 * 60 * 60 * 1000
  };

  const dados = Buffer
    .from(JSON.stringify(payload))
    .toString('base64url');

  const assinatura = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(dados)
    .digest('base64url');

  return `${dados}.${assinatura}`;
}

function verificarToken(req, res, next) {
  try {
    const cabecalho = req.headers.authorization || '';

    if (!cabecalho.startsWith('Bearer ')) {
      return res.status(401).json({
        erro: 'Acesso não autorizado.'
      });
    }

    const token = cabecalho.substring(7);
    const partes = token.split('.');

    if (partes.length !== 2) {
      return res.status(401).json({
        erro: 'Token inválido.'
      });
    }

    const [dados, assinaturaRecebida] = partes;

    const assinaturaEsperada = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(dados)
      .digest('base64url');

    if (!compararSeguro(assinaturaRecebida, assinaturaEsperada)) {
      return res.status(401).json({
        erro: 'Token inválido.'
      });
    }

    const payload = JSON.parse(
      Buffer.from(dados, 'base64url').toString('utf8')
    );

    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return res.status(401).json({
        erro: 'Sessão expirada. Entre novamente.'
      });
    }

    req.usuario = payload.sub;
    next();

  } catch (erro) {
    return res.status(401).json({
      erro: 'Não foi possível validar sua sessão.'
    });
  }
}

function validarCredenciais(usuario, senha) {
  return (
    compararSeguro(usuario, process.env.ADMIN_USER) &&
    compararSeguro(senha, process.env.ADMIN_PASSWORD)
  );
}

module.exports = {
  gerarToken,
  verificarToken,
  validarCredenciais
};
