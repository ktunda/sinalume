// Vocabulário inicial do Sinalume. Cada sinal é identificado por uma GLOSA
// (palavra em maiúsculas que representa o sinal em Libras).
// A lista final deve ser revisada com intérpretes e pessoas surdas.

export interface ItemVocab {
  glosa: string
  /** texto em português usado na frase e na voz */
  texto: string
  categoria: Categoria
}

export type Categoria = 'cumprimentos' | 'pessoas' | 'necessidades' | 'perguntas' | 'conversa' | 'igreja'

export const CATEGORIAS: Record<Categoria, string> = {
  cumprimentos: 'Cumprimentos',
  pessoas: 'Pessoas',
  necessidades: 'Necessidades e saúde',
  perguntas: 'Perguntas',
  conversa: 'Conversa',
  igreja: 'Igreja',
}

const v = (categoria: Categoria, pares: [string, string][]): ItemVocab[] =>
  pares.map(([glosa, texto]) => ({ glosa, texto, categoria }))

export const VOCABULARIO: ItemVocab[] = [
  ...v('cumprimentos', [
    ['OI', 'oi'], ['TCHAU', 'tchau'], ['BOM-DIA', 'bom dia'], ['BOA-TARDE', 'boa tarde'],
    ['BOA-NOITE', 'boa noite'], ['OBRIGADO', 'obrigado'], ['POR-FAVOR', 'por favor'],
    ['DESCULPA', 'desculpa'], ['TUDO-BEM', 'tudo bem'], ['PRAZER', 'prazer'],
  ]),
  ...v('pessoas', [
    ['EU', 'eu'], ['VOCÊ', 'você'], ['NÓS', 'nós'], ['ELE', 'ele'], ['ELA', 'ela'],
    ['NOME', 'nome'], ['FAMÍLIA', 'família'], ['AMIGO', 'amigo'], ['MÃE', 'mãe'], ['PAI', 'pai'],
    ['FILHO', 'filho'], ['SURDO', 'surdo'], ['OUVINTE', 'ouvinte'], ['INTÉRPRETE', 'intérprete'],
  ]),
  ...v('necessidades', [
    ['ÁGUA', 'água'], ['BANHEIRO', 'banheiro'], ['AJUDA', 'ajuda'], ['DOR', 'dor'],
    ['MÉDICO', 'médico'], ['REMÉDIO', 'remédio'], ['COMER', 'comer'], ['BEBER', 'beber'],
    ['CASA', 'casa'], ['ÔNIBUS', 'ônibus'], ['TRABALHO', 'trabalho'], ['DINHEIRO', 'dinheiro'],
  ]),
  ...v('perguntas', [
    ['ONDE', 'onde'], ['QUANDO', 'quando'], ['QUEM', 'quem'], ['O-QUE', 'o que'],
    ['COMO', 'como'], ['POR-QUE', 'por que'], ['QUANTO', 'quanto'],
  ]),
  ...v('conversa', [
    ['SIM', 'sim'], ['NÃO', 'não'], ['QUERER', 'querer'], ['PRECISAR', 'precisar'],
    ['GOSTAR', 'gostar'], ['ENTENDER', 'entender'], ['NÃO-ENTENDER', 'não entendi'],
    ['REPETIR', 'repita, por favor'], ['DEVAGAR', 'mais devagar'], ['ESPERAR', 'esperar'],
    ['IR', 'ir'], ['VIR', 'vir'], ['SABER', 'saber'], ['AGORA', 'agora'], ['HOJE', 'hoje'],
    ['AMANHÃ', 'amanhã'], ['BOM', 'bom'], ['RUIM', 'ruim'],
  ]),
  ...v('igreja', [
    ['DEUS', 'Deus'], ['JESUS', 'Jesus'], ['ESPÍRITO-SANTO', 'Espírito Santo'],
    ['ORAÇÃO', 'oração'], ['ORAR', 'orar'], ['IGREJA', 'igreja'], ['CULTO', 'culto'],
    ['MISSA', 'missa'], ['BÍBLIA', 'Bíblia'], ['LOUVOR', 'louvor'], ['AMÉM', 'amém'],
    ['PASTOR', 'pastor'], ['PADRE', 'padre'], ['IRMÃO', 'irmão'], ['IRMÃ', 'irmã'],
    ['PAZ', 'paz'], ['GRAÇA', 'graça'], ['AMOR', 'amor'], ['FÉ', 'fé'], ['BÊNÇÃO', 'bênção'],
    ['PERDÃO', 'perdão'], ['CÉLULA', 'célula'], ['BATISMO', 'batismo'], ['CEIA', 'ceia'],
    ['VISITANTE', 'visitante'], ['BEM-VINDO', 'bem-vindo'],
  ]),
]

export const VOCAB_POR_GLOSA = new Map(VOCABULARIO.map((i) => [i.glosa, i]))
