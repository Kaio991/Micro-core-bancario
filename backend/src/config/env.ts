// backend/src/config/env.ts
//
// Centraliza a leitura e validação das variáveis de ambiente sensíveis.
// Filosofia "fail-fast": se algo crítico estiver ausente, o processo
// não sobe — em vez de cair silenciosamente em runtime (ex: usando
// uma chave JWT hardcoded como fallback).

function required(name: string): string {
    const value = process.env[name];

    if (!value) {
        console.error(`❌ ERRO: A variável de ambiente "${name}" não foi definida no arquivo .env!`);
        process.exit(1);
    }

    return value;
}

export const SECRET = required('SECRET');

// Aviso não-bloqueante: uma chave curta é fraca contra ataques de força bruta,
// mas não impede o boot (diferente da ausência total da variável).
if (SECRET.length < 32) {
    console.warn(
        `⚠️  Aviso: a variável SECRET tem apenas ${SECRET.length} caracteres. ` +
        `Recomenda-se usar uma chave aleatória de pelo menos 32 caracteres em produção ` +
        `(ex: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))").`
    );
}