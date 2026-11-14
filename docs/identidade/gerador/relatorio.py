"""Revisão do app e plano de evolução com patrocínio — PDF no padrão da marca."""
import base
from base import *
import apresentacao  # reaproveita o estilo extra (EXTRA) da apresentação

base.TOTAL = 9
base.DOC = 'Revisão e plano de patrocínio'
EXTRA = apresentacao.EXTRA + f'''
.status {{ display: inline-block; font-size: 7.6pt; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; padding: .8mm 2.4mm; border-radius: 1mm; white-space: nowrap; }}
.st-ok {{ background: #E5F3EA; color: #0F5C2B; }} .st-at {{ background: #FDF1DC; color: #7A4D00; }} .st-cr {{ background: #FCEFEE; color: #8A1A12; }}
.nivel {{ border: .6pt solid {BORDA}; border-radius: 3mm; overflow: hidden; margin-top: 5mm; break-inside: avoid; }}
.nivel .topo-n {{ background: {AZUL}; color: #fff; padding: 4mm 6mm; display: flex; justify-content: space-between; align-items: baseline; }}
.nivel .topo-n b {{ color: #fff; font-size: 13pt; font-weight: 900; }}
.nivel .topo-n span {{ color: {AMBAR}; font-weight: 900; font-size: 10.5pt; }}
.nivel ul {{ padding: 4mm 6mm 4mm 10mm; }}
.nivel li {{ font-size: 10pt; }}
.nivel li + li {{ margin-top: 1.6mm; }}
.nivel .resultado {{ background: {NEVOA}; padding: 3mm 6mm; font-size: 9.4pt; color: {GRAFITE}; border-top: .4pt solid {BORDA}; }}
td {{ vertical-align: top; }}
.pequeno {{ font-size: 8.4pt; color: {CINZA}; }}
'''

P = []

P.append(pagina(1, '', f'''
<div class="topo"><span>Revisão do app</span><span>Novembro de 2026</span></div>
<div class="marca">{logo(texto="#fff", estilo="width:130mm")}</div>
<div class="sub">Diagnóstico e próximos passos</div>
<div class="titulo"><h1>Revisão do app e<br>plano com patrocínio</h1><p>O que está pronto, o que falta e como cada real investido<br>pode ampliar o Sinalume para a comunidade surda.</p></div>
<div class="faixa"></div>''', 'capa'))

P.append(pagina(2, 'Resumo', f'''
{cabecalho('01 · Resumo', 'Onde o Sinalume está hoje', 'O app funciona, é seguro e custa zero. O maior gargalo não é técnico: é o vocabulário de sinais, que depende de gravações da comunidade.')}
<div class="numeros">
 <div><b>10</b><span>telas no ar, iPhone e Android</span></div>
 <div><b>0 de 87</b><span>sinais prontos para o reconhecimento pela câmera</span></div>
 <div><b>20</b><span>testes automáticos, incluindo segurança</span></div>
 <div><b>R$ 0</b><span>de custo mensal de operação</span></div>
</div>
<h2 style="margin-top:10mm">Funcionando bem</h2>
<ul>
 <li><b>Ouvinte fala → Libras:</b> legenda grande e avatar VLibras, com voz do navegador ou transcrição no próprio aparelho.</li>
 <li><b>Modo culto nos dois sentidos,</b> com tela acesa, tela cheia e legenda enorme.</li>
 <li><b>Base da comunidade:</b> envio com consentimento, revisão automática, aprovação em um clique e chave secreta de remoção.</li>
 <li><b>Segurança revisada</b> (sem banco de dados, API restrita, política de conteúdo) e manual, apresentação e marca padronizados.</li>
</ul>
<h2>O ponto crítico</h2>
<p>A tela <b>Surdo sinaliza</b> só reconhece sinais que a comunidade já gravou. Hoje nenhum dos 87 sinais do vocabulário inicial chegou à meta de 10 gravações de 3 pessoas. Até isso mudar, o sentido Libras → português funciona como demonstração, não como ferramenta do dia a dia.</p>
<div class="destaque"><div class="bola"></div><p><b>Prioridade número 1:</b> gravar os 87 sinais iniciais com pessoas surdas e intérpretes. Isso pode ser feito sem patrocínio, com mutirões em igrejas, e fica muito mais rápido com patrocínio.</p></div>'''))

linhas_corr = [
    ('Modo culto: o avatar cortava o sinal no meio quando chegava uma frase nova.', 'O avatar termina o sinal e segue para as frases mais recentes.'),
    ('Quando o tradutor do VLibras falhava (sem internet), nada aparecia.', 'O app avisa na tela e a legenda continua.'),
    ('O botão "Segure para falar" não funcionava pelo teclado nem com leitor de tela.', 'Segurar Espaço ou Enter também fala.'),
    ('No culto, a tela podia apagar depois de trocar de app e voltar.', 'O app pede de novo para manter a tela acesa.'),
    ('O microfone podia ficar ligado ao sair da tela Ouvinte fala no meio da fala.', 'O microfone desliga ao sair.'),
]
P.append(pagina(3, 'Falhas', f'''
{cabecalho('02 · Falhas encontradas', 'Corrigidas nesta revisão', 'Já publicadas no app. Somam-se às 10 correções de segurança da revisão anterior (docs/SEGURANCA.md).')}
<table><tr><th style="width:50%">Problema</th><th>Correção</th><th style="width:20mm">Situação</th></tr>
{''.join(f'<tr><td>{a}</td><td>{b}</td><td><span class="status st-ok">Corrigido</span></td></tr>' for a, b in linhas_corr)}
</table>
<div class="nota" style="margin-top:8mm"><p><b>Como foi feita a revisão:</b> leitura do código de todas as telas e serviços, testes automáticos, verificação de dependências e navegação em tamanhos de Android e iPhone, sem erros e sem rolagem lateral.</p></div>'''))

P.append(pagina(4, 'Pontos de atenção', f'''
{cabecalho('03 · Pontos de atenção', 'O que ainda precisa de decisão ou recurso', 'Nenhum destes pontos impede o uso hoje, mas eles limitam o alcance do app.')}
<table><tr><th style="width:36%">Ponto</th><th>Por que importa</th><th style="width:20mm">Risco</th></tr>
<tr><td><b>Vocabulário vazio</b></td><td>Sem gravações, a câmera não reconhece nada.</td><td><span class="status st-cr">Alto</span></td></tr>
<tr><td><b>Nunca testado com pessoas surdas</b></td><td>O reconhecimento com mãos reais, em celulares reais, ainda não foi validado por quem vai usar.</td><td><span class="status st-cr">Alto</span></td></tr>
<tr><td><b>App só em português escrito</b></td><td>Para muitas pessoas surdas, a Libras é a primeira língua. Falta explicar cada tela com vídeo em Libras.</td><td><span class="status st-at">Médio</span></td></tr>
<tr><td><b>Depende dos servidores do VLibras</b></td><td>Se o tradutor do governo cair, o avatar para (a legenda continua).</td><td><span class="status st-at">Médio</span></td></tr>
<tr><td><b>Transcrição no aparelho lenta</b></td><td>Cerca de 20 s para 4 s de fala num PC; em celular simples, mais. A voz do navegador é rápida, mas envia o áudio ao Google.</td><td><span class="status st-at">Médio</span></td></tr>
<tr><td><b>Sinais isolados, com pausa</b></td><td>Ainda não reconhece frases contínuas nem expressões faciais (pergunta, negação).</td><td><span class="status st-at">Médio</span></td></tr>
<tr><td><b>Fora das lojas de apps</b></td><td>Quem procura "Libras" na Play Store ou na App Store não encontra o Sinalume.</td><td><span class="status st-at">Médio</span></td></tr>
<tr><td><b>Uma pessoa mantém tudo</b></td><td>Risco de continuidade se o mantenedor ficar indisponível.</td><td><span class="status st-at">Médio</span></td></tr>
<tr><td><b>Sem medição de uso</b></td><td>Por privacidade, não há estatísticas, mas patrocinadores vão querer ver impacto.</td><td><span class="status st-at">Baixo</span></td></tr>
</table>'''))

P.append(pagina(5, 'Sem custo', f'''
{cabecalho('04 · Melhorias sem custo', 'O que dá para fazer já', 'Ações que dependem de pessoas, não de dinheiro, ou que custam quase nada.')}
<div class="cards">
 <div class="card"><h3>Mutirões de gravação</h3><p>Três encontros em igrejas com ministério de surdos, de 5 a 20 pessoas cada, gravando os mesmos sinais. Meta: os 87 sinais iniciais prontos.</p></div>
 <div class="card"><h3>Vídeos curtos em Libras</h3><p>Um(a) intérprete voluntário(a) grava 1 vídeo de até 1 minuto por tela. O app mostra o vídeo no botão “?”.</p></div>
 <div class="card"><h3>Primeiros testes com surdos</h3><p>Cinco pessoas surdas usam o app por 30 minutos, com roteiro simples. As falhas viram issues no GitHub.</p></div>
 <div class="card"><h3>Frases prontas</h3><p>Atalhos para o ouvinte tocar e o avatar sinalizar: “Qual seu nome?”, “Onde dói?”, “Bem-vindo à igreja”. Funciona mesmo com barulho.</p></div>
 <div class="card"><h3>Contador de uso anônimo</h3><p>Só números (quantas vezes cada tela foi aberta), sem cookies, sem identificar ninguém. Mostra impacto aos apoiadores.</p></div>
 <div class="card"><h3>Letra maior e alto contraste</h3><p>Ajuste de tamanho e contraste para pessoas com baixa visão, comum em pessoas surdas idosas.</p></div>
</div>
<div class="nota" style="margin-top:7mm"><p><b>Quase grátis:</b> publicar o Sinalume na Play Store custa US$ 25, pagos uma única vez. O app atual pode ser empacotado como está, sem reescrever nada.</p></div>'''))

P.append(pagina(7, 'Patrocínio', f'''
{cabecalho('05 · Com patrocínio', 'O que cada nível de apoio permite', 'Valores são estimativas para orientar conversas com patrocinadores e devem ser orçados antes de assumir compromissos.')}
<div class="nivel"><div class="topo-n"><b>Nível 1 · Semente</b><span>até R$ 5 mil</span></div>
<ul>
 <li><b>Cachê para sessões de gravação</b> com pessoas surdas e intérpretes. Paga o tempo de quem ensina o app e acelera o vocabulário.</li>
 <li><b>Lojas de apps:</b> Play Store (US$ 25, uma vez) e App Store (US$ 99 por ano).</li>
 <li><b>Celulares de teste:</b> um Android de entrada e um iPhone usado, para testar como a maioria usa.</li>
 <li><b>Kit culto</b> para 3 igrejas-piloto: suporte de celular, microfone de lapela e cabo para TV ou projetor.</li>
</ul><div class="resultado">Resultado: os 87 sinais prontos, app nas duas lojas e o modo culto funcionando em igrejas reais.</div></div>
<div class="nivel"><div class="topo-n"><b>Nível 2 · Crescimento</b><span>R$ 5 mil a R$ 30 mil</span></div>
<ul>
 <li><b>Testes de usabilidade remunerados</b> com pessoas surdas de diferentes idades e regiões.</li>
 <li><b>Vídeos profissionais em Libras</b> para todas as telas, o manual e a divulgação.</li>
 <li><b>Reconhecimento por rede neural,</b> treinada em nuvem com V-LIBRASIL e o acervo da comunidade. É mais preciso e mais rápido no celular.</li>
 <li><b>Auditoria de acessibilidade</b> e design com especialistas.</li>
 <li><b>Ampliação do vocabulário</b> para 500 sinais, com pacotes de saúde, escola, trabalho e igreja.</li>
</ul><div class="resultado">Resultado: reconhecimento confiável no dia a dia e app validado pela comunidade surda.</div></div>'''))

P.append(pagina(6, 'Patrocínio', f'''
<div class="nivel" style="margin-top:0"><div class="topo-n"><b>Nível 3 · Parceria institucional</b><span>acima de R$ 30 mil</span></div>
<ul>
 <li><b>Frases contínuas e expressões faciais,</b> em pesquisa com universidade (bolsas de iniciação científica ou mestrado).</li>
 <li><b>Avatar mais leve e moderno,</b> em parceria com a equipe do VLibras/UFPB, sem depender do player antigo.</li>
 <li><b>Equipe mínima:</b> bolsa para um(a) desenvolvedor(a) e para um(a) coordenador(a) surdo(a) da comunidade, que decide prioridades.</li>
 <li><b>Pilotos em postos de saúde e escolas</b> de uma cidade, com medição de impacto.</li>
 <li><b>“Chamar intérprete”:</b> um botão que liga para uma central de interpretação humana por vídeo quando o app não for suficiente. Exige parceria com um serviço de interpretação.</li>
</ul><div class="resultado">Resultado: o Sinalume passa de projeto voluntário a serviço contínuo de acessibilidade, com governança da própria comunidade surda.</div></div>
<h2>Regras para aceitar patrocínio</h2>
<ul>
 <li><b>Sem anúncios e sem venda de dados,</b> nunca. A contrapartida é o nome do apoiador na tela Sobre e no relatório anual.</li>
 <li><b>Prestação de contas pública:</b> cada real recebido e gasto em uma página aberta do projeto.</li>
 <li><b>A comunidade surda decide prioridades:</b> patrocinador apoia, não direciona o produto.</li>
 <li><b>Código e dados continuam abertos</b> (GPL-3.0 e CC BY 4.0), mesmo com dinheiro de empresa.</li>
</ul>
<div class="nota"><p><b>Atenção:</b> para receber recursos de empresas e editais, normalmente é preciso um CNPJ (associação ou igreja parceira) e um contrato simples. Vale conversar com um(a) contador(a) ou advogado(a) antes de assinar.</p></div>'''))

P.append(pagina(8, 'Onde buscar', f'''
{cabecalho('06 · Onde buscar apoio', 'Possíveis patrocinadores e parceiros', 'Verifique sempre se há chamada aberta: programas e editais mudam a cada ano.')}
<table><tr><th style="width:44mm">Tipo</th><th>Quem</th><th>Como encaixar o Sinalume</th></tr>
<tr><td><b>Igrejas e denominações</b></td><td>Ministérios de surdos, convenções e missões</td><td>Kit culto e mutirões; apoio direto e voluntários que sabem Libras.</td></tr>
<tr><td><b>Comunidade surda</b></td><td>Associações de surdos, Feneis, Febrapils, INES</td><td>Validação, gravação de sinais e credibilidade. São parceiros, não só patrocinadores.</td></tr>
<tr><td><b>Universidades</b></td><td>Laboratórios de tecnologia assistiva; editais de apoio, como os da UnB</td><td>Pesquisa em reconhecimento contínuo, bolsas e testes com usuários.</td></tr>
<tr><td><b>Governo</b></td><td>Equipe do VLibras (UFPB) e programas de tecnologia assistiva do INES</td><td>Parceria técnica no avatar e no tradutor; uso em serviços públicos.</td></tr>
<tr><td><b>Programas de empresas de tecnologia</b></td><td>Microsoft AI for Accessibility; desafios temáticos do Google.org</td><td>Créditos de nuvem e recursos para IA de acessibilidade. Conferir abertura e regras.</td></tr>
<tr><td><b>Empresas locais</b></td><td>Comércio, clínicas e escolas da região</td><td>Patrocínio do Nível 1 em troca de citação na tela Sobre.</td></tr>
<tr><td><b>Doações individuais</b></td><td>GitHub Sponsors, Open Collective ou Pix de uma entidade parceira</td><td>Recorrência pequena e transparente para custos fixos (lojas de apps, testes).</td></tr>
</table>
<h2>Kit para conversar com patrocinadores</h2>
<ul>
 <li>Apresentação do projeto e Manual da Marca (já prontos).</li>
 <li>Este plano, com o nível de apoio sugerido para cada parceiro.</li>
 <li>Um vídeo de 1 minuto mostrando o modo culto e uma pessoa surda usando o app (gravar).</li>
 <li>Números de uso, depois do contador anônimo.</li>
</ul>'''))

P.append(pagina(9, '', f'''
<div class="centro">
 {logo(texto="#fff", halo=False, estilo="width:90mm")}
 <p style="margin-top:9mm;font-size:11pt">Tradução entre Libras e português, grátis e de código aberto.</p>
 <div class="links"><div class="qrb">{qr()}</div>
  <p>App: <b style="color:#fff">ktunda.github.io/sinalume</b><br>Código: <b style="color:#fff">github.com/ktunda/sinalume</b><br>Segurança: <b style="color:#fff">docs/SEGURANCA.md</b></p></div>
 <p style="margin-top:14mm;font-size:8pt;color:rgba(255,255,255,.55)">Revisão e plano de patrocínio · novembro de 2026<br>Valores são estimativas e devem ser orçados antes de qualquer compromisso.</p>
</div><div class="faixa"></div>''', 'contracapa'))

html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Sinalume — Revisão e plano de patrocínio</title><style>{CSS}{EXTRA}</style></head><body>{"".join(P)}</body></html>'
pathlib.Path(__file__).with_name('relatorio.html').write_text(html)
print('ok')
