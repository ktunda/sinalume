// Termo de consentimento para doação de gravações de sinais (LGPD).
// Ao mudar o texto de forma relevante, troque VERSAO_TERMO: os próximos envios registram a nova versão.

export const VERSAO_TERMO = '2026-11-14'
/** versões anteriores do termo que ainda valem para envios guardados */
const VERSOES_ACEITAS: string[] = []

export const TERMO: { titulo: string; paragrafos: string[] }[] = [
  {
    titulo: 'O que você está doando',
    paragrafos: [
      'Ao enviar suas gravações, você doa ao projeto Sinalume os pontos de referência das mãos (números com as posições dos dedos e das mãos em cada quadro), extraídos no seu próprio celular.',
      'O vídeo da câmera não é gravado nem enviado. A partir desses pontos não é possível reconstruir o seu rosto, a sua voz ou a sua imagem.',
    ],
  },
  {
    titulo: 'Para que será usado',
    paragrafos: [
      'Para ensinar o Sinalume a reconhecer sinais de Libras e melhorar a comunicação entre pessoas surdas e ouvintes.',
      'As gravações aprovadas passam a fazer parte do acervo aberto do Sinalume e são compartilhadas publicamente sob a licença Creative Commons Atribuição 4.0 (CC BY 4.0). Isso permite que outras pessoas, escolas, igrejas e pesquisadores usem e compartilhem esses dados, inclusive para treinar outros modelos, desde que citem o Sinalume.',
      'O Sinalume é gratuito, sem anúncios e sem fins comerciais.',
    ],
  },
  {
    titulo: 'Seus dados pessoais',
    paragrafos: [
      'Apelido e estado são opcionais. Se você informar, eles aparecem junto da contribuição, para dar crédito e mostrar a variedade regional dos sinais. Não use seu nome completo se não quiser ser identificado.',
      'O Sinalume não coleta nome completo, e-mail, telefone, endereço IP ou localização.',
      'Com o envio, ficam registrados a versão deste termo, a data do aceite e a confirmação de idade.',
    ],
  },
  {
    titulo: 'Idade',
    paragrafos: [
      'Você declara ter 18 anos ou mais. Se quem gravou tem menos de 18 anos, o envio só pode ser feito pelo pai, mãe ou responsável legal, que autoriza a doação em nome da criança ou do adolescente.',
    ],
  },
  {
    titulo: 'Seus direitos',
    paragrafos: [
      'O consentimento é voluntário e pode ser revogado a qualquer momento. Para pedir a remoção, use a aba Sugestões, escolha "Remover minhas gravações" e informe o código do envio que aparece no app depois de enviar.',
      'As gravações serão removidas do acervo do Sinalume. Cópias já baixadas por terceiros antes da remoção, sob a licença aberta, não podem ser recolhidas pelo projeto.',
      'Você também pode pedir informações sobre o uso dos seus dados pelo mesmo canal.',
    ],
  },
]

export interface Consentimento {
  versao: string
  aceitoEm: string
  maiorIdadeOuResponsavel: true
  licenca: 'CC-BY-4.0'
}

export function novoConsentimento(): Consentimento {
  return {
    versao: VERSAO_TERMO,
    aceitoEm: new Date().toISOString(),
    maiorIdadeOuResponsavel: true,
    licenca: 'CC-BY-4.0',
  }
}

/** Confere um consentimento recebido (usado na função de envio). */
export function consentimentoValido(c: unknown): c is Consentimento {
  const x = c as Partial<Consentimento> | null
  return (
    !!x &&
    (x.versao === VERSAO_TERMO || VERSOES_ACEITAS.includes(String(x.versao))) &&
    x.maiorIdadeOuResponsavel === true &&
    x.licenca === 'CC-BY-4.0' &&
    typeof x.aceitoEm === 'string' &&
    !Number.isNaN(Date.parse(x.aceitoEm))
  )
}

/** Cópia limpa (só os campos esperados) para guardar como prova do consentimento. */
export function registroConsentimento(c: Consentimento, recebidoEm: string) {
  return {
    versao: c.versao,
    aceitoEm: c.aceitoEm,
    maiorIdadeOuResponsavel: true as const,
    licenca: 'CC-BY-4.0' as const,
    recebidoEm,
  }
}
