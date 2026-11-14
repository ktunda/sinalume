from base import *
paginas = []

# 1 capa
paginas.append(pagina(1, '', f'''
<div class="anel" style="width:44mm;height:44mm"></div><div class="anel" style="width:96mm;height:96mm;opacity:.7"></div><div class="anel" style="width:170mm;height:170mm;opacity:.45"></div><div class="anel" style="width:260mm;height:260mm;opacity:.3"></div>
<div class="topo"><span>Identidade visual</span><span>Versão 1.0 · Novembro de 2026</span></div>
<div class="marca">{logo(texto="#fff", estilo="width:130mm")}</div>
<div class="titulo"><h1>Manual da Marca</h1><p>Diretrizes de uso do logotipo, das cores, da tipografia e da linguagem do Sinalume.</p></div>
<div class="faixa"></div>''', 'capa'))

# 2 sumário + apresentação
paginas.append(pagina(2, 'Apresentação', f'''
{cabecalho('Apresentação', 'Uma marca para aproximar pessoas')}
<div class="grade2">
 <div>
  <p>O <b>Sinalume</b> é um aplicativo gratuito e de código aberto que traduz entre a Língua Brasileira de Sinais (Libras) e o português, direto no celular. Foi criado para servir à comunidade surda, a famílias de baixa renda e a comunidades cristãs, sem fins comerciais.</p>
  <p>Este manual reúne as regras que mantêm a marca reconhecível e consistente em qualquer aplicação: no app, em cartazes de igreja, em redes sociais, em apresentações e em materiais de parceiros.</p>
  <p>Ser gratuito não significa ser improvisado. Uma identidade cuidada transmite confiança a quem usa, a quem divulga e a quem apoia o projeto.</p>
 </div>
 <div>
  <h3>Sumário</h3>
  <ul class="sumario">
   <li><span>01</span><span>Conceito e nome</span><span>03</span></li>
   <li><span>02</span><span>Logotipo e versões</span><span>04</span></li>
   <li><span>03</span><span>Área de proteção e tamanho mínimo</span><span>05</span></li>
   <li><span>04</span><span>Usos incorretos</span><span>06</span></li>
   <li><span>05</span><span>Cores</span><span>07</span></li>
   <li><span>06</span><span>Contraste e acessibilidade</span><span>08</span></li>
   <li><span>07</span><span>Tipografia</span><span>09</span></li>
   <li><span>08</span><span>Voz e linguagem</span><span>10</span></li>
   <li><span>09</span><span>Aplicações</span><span>11</span></li>
  </ul>
 </div>
</div>'''))

# 3 conceito
paginas.append(pagina(3, 'Conceito', f'''
{cabecalho('01 · Conceito e nome', 'Sinal + lume', 'O nome une <b>sinal</b>, a unidade da Libras, a <b>lume</b>, palavra antiga para luz. O Sinalume ilumina a conversa entre quem sinaliza e quem fala.')}
<div class="painel" style="background:{NEVOA};height:78mm;margin-bottom:9mm">{logo(estilo="width:140mm")}</div>
<div class="grade3">
 <div><h3>O ponto de luz</h3><p>O pingo do “i” é um ponto âmbar com um halo suave. Ele representa a luz que se acende quando duas pessoas se entendem, e também a ponta do dedo que faz o sinal.</p></div>
 <div><h3>Formas arredondadas</h3><p>As letras em caixa-baixa e cantos redondos tornam a marca próxima, acolhedora e fácil de ler, inclusive para quem está aprendendo português como segunda língua.</p></div>
 <div><h3>Azul e âmbar</h3><p>O azul profundo transmite confiança e serviço público. O âmbar é calor e atenção: aparece pouco, sempre como ponto de destaque.</p></div>
</div>
<div class="nota"><p><b>Assinatura.</b> Quando for necessário explicar o que o Sinalume faz, use: “Tradução entre Libras e português, grátis e de código aberto.”</p></div>'''))

# 4 versões
paginas.append(pagina(4, 'Logotipo', f'''
{cabecalho('02 · Logotipo e versões', 'Versões do logotipo', 'Use sempre os arquivos oficiais. Escolha a versão pelo fundo: o logotipo precisa de contraste para ser lido de longe.')}
<div class="grade2 versao">
 <div><div class="painel" style="background:#fff;border:.5pt solid {BORDA}">{logo(estilo="width:62mm")}</div>
  <h3>Principal</h3><p>Azul Sinalume com o ponto âmbar. É a versão preferida, sobre fundos brancos ou Névoa.</p></div>
 <div><div class="painel" style="background:{AZUL}">{logo(texto="#fff", halo=False, estilo="width:62mm")}</div>
  <h3>Negativa</h3><p>Branca com o ponto âmbar, sobre o Azul Sinalume ou o Azul Profundo. Sem o halo, que some em fundos escuros.</p></div>
 <div><div class="painel" style="background:#fff;border:.5pt solid {BORDA}">{logo(texto=GRAFITE, ponto=GRAFITE, halo=False, estilo="width:62mm")}</div>
  <h3>Monocromática</h3><p>Uma só cor, para impressão em preto e branco, carimbo, gravação ou fax. O ponto mantém a mesma posição.</p></div>
 <div><div class="painel" style="background:{NEVOA};gap:9mm">{icone(estilo="width:30mm")}{icone(raio=0, estilo="width:30mm;border-radius:50%")}</div>
  <h3>Ícone</h3><p>O “s” com o ponto de luz. Use no ícone do app, em avatares de redes sociais e em espaços quadrados ou pequenos.</p></div>
</div>
<p class="legenda" style="margin-top:6mm">Arquivos: <b>sinalume-logo.svg</b>, <b>sinalume-logo-branco.svg</b>, <b>sinalume-icone.svg</b> e <b>sinalume-icone-maskable.svg</b>, na pasta docs/identidade do repositório.</p>'''))

# 5 proteção
x = 'x'
paginas.append(pagina(5, 'Proteção', f'''
{cabecalho('03 · Área de proteção e tamanho mínimo', 'Espaço para respirar', 'Nenhum texto, imagem ou borda deve invadir a área de proteção ao redor do logotipo.')}
<div style="text-align:center;margin:4mm 0 8mm">
 <div class="protecao"><div class="dentro">{logo(estilo="width:110mm;display:block")}</div>
  <span class="cota" style="top:4.5mm;left:50%;transform:translateX(-50%)">x</span>
  <span class="cota" style="bottom:4.5mm;left:50%;transform:translateX(-50%)">x</span>
  <span class="cota" style="left:5mm;top:50%;transform:translateY(-50%)">x</span>
  <span class="cota" style="right:5mm;top:50%;transform:translateY(-50%)">x</span>
 </div>
</div>
<p><b>A medida x</b> é o diâmetro do ponto de luz, sem o halo. A área de proteção mínima é de <b>1x</b> em todos os lados. Em cartazes e capas, prefira 2x.</p>
<h2>Tamanho mínimo</h2>
<div class="grade2" style="align-items:end">
 <div>
  <div style="display:flex;align-items:flex-end;gap:10mm;border-bottom:.4pt solid {BORDA};padding-bottom:4mm">
   <div>{logo(estilo="width:25mm;display:block")}<p class="legenda">Impresso: 25 mm</p></div>
   <div>{logo(estilo="width:96px;display:block")}<p class="legenda">Tela: 96 px</p></div>
  </div>
 </div>
 <div>
  <div style="display:flex;align-items:flex-end;gap:10mm;border-bottom:.4pt solid {BORDA};padding-bottom:4mm">
   <div>{icone(estilo="width:8mm;display:block")}<p class="legenda">Ícone impresso: 8 mm</p></div>
   <div>{icone(estilo="width:24px;display:block")}<p class="legenda">Ícone em tela: 24 px</p></div>
  </div>
 </div>
</div>
<div class="nota"><p>Abaixo desses tamanhos, o ponto de luz deixa de ser visto e o nome perde a leitura. Se o espaço for menor, use o ícone.</p></div>'''))

# 6 incorretos
R = 'width:42mm'
paginas.append(pagina(6, 'Usos incorretos', f'''
{cabecalho('04 · Usos incorretos', 'O que não fazer', 'Alterar o logotipo enfraquece a marca. Estes são os erros mais comuns, e todos devem ser evitados.')}
<div class="grade3" style="row-gap:8mm">
 {errado(logo(estilo="width:42mm;transform:scaleX(1.3) scaleY(.75)"), 'Não distorça, estique ou achate o logotipo.')}
 {errado(logo(texto="#157F3B", ponto="#B42318", estilo=R), 'Não troque as cores por outras fora da paleta.')}
 {errado(logo(estilo=R+";transform:rotate(-12deg)"), 'Não gire nem incline o logotipo.')}
 {errado(f'<svg style="{R}" viewBox="{LOGO_VB}"><path d="{LOGO_PATH}" fill="{AZUL}"/></svg>', 'Não remova nem mova o ponto de luz.')}
 {errado(logo(estilo=R+";filter:drop-shadow(2mm 2mm 1.2mm rgba(0,0,0,.45))"), 'Não aplique sombras, contornos, brilhos ou degradês.')}
 {errado(logo(texto=PROFUNDO, estilo=R), 'Não use a versão azul sobre fundo escuro.', fundo=AZUL)}
 {errado(logo(texto="#fff", estilo=R), 'Não use a versão branca sobre fundo claro ou âmbar.', fundo=AMBAR)}
 {errado(logo(estilo=R), 'Não coloque sobre fotos ou fundos com muita informação.', fundo="repeating-linear-gradient(45deg,#c9d3e8 0 3mm,#f3d9a8 3mm 6mm,#b9c6e0 6mm 9mm)")}
 {errado(f'<span style="font:400 17pt Georgia,serif;color:{AZUL}">Sinalume</span>', 'Não reescreva o nome em outra fonte para substituir o logotipo.')}
</div>'''))

# 7 cores
paginas.append(pagina(7, 'Cores', f'''
{cabecalho('05 · Cores', 'Paleta oficial', 'Poucas cores, usadas com disciplina. O azul conduz, o âmbar destaca, os neutros organizam.')}
<div class="amostras">
 {amostra('Azul Sinalume', AZUL, '27 · 58 · 140', '81 · 59 · 0 · 45', 'Cor principal. Logotipo, títulos, botões e fundos de capa.')}
 {amostra('Âmbar Lume', AMBAR, '244 · 165 · 28', '0 · 32 · 89 · 4', 'Destaque. O ponto de luz, faixas e detalhes. Nunca para texto sobre branco.', False)}
 {amostra('Azul Profundo', PROFUNDO, '18 · 42 · 102', '82 · 59 · 0 · 60', 'Apoio. Contracapas, rodapés e estados pressionados.')}
 {amostra('Grafite', GRAFITE, '17 · 24 · 39', '56 · 38 · 0 · 85', 'Texto principal sobre fundos claros.')}
 {amostra('Névoa', NEVOA, '246 · 247 · 251', '2 · 2 · 0 · 2', 'Fundo de telas, painéis e áreas de respiro.', False)}
 {amostra('Cinza Texto', CINZA, '75 · 85 · 99', '24 · 14 · 0 · 61', 'Texto secundário, legendas e descrições.')}
</div>
<h2>Proporção de uso</h2>
<div class="proporcao">
 <div style="width:60%;background:{NEVOA};color:{GRAFITE}">Branco e Névoa · 60%</div>
 <div style="width:30%;background:{AZUL};color:#fff">Azuis · 30%</div>
 <div style="width:10%;background:{AMBAR};color:{GRAFITE};padding-left:2mm">10%</div>
</div>
<p class="legenda">Cores de sistema, só para avisos no app: Verde Sucesso #157F3B e Vermelho Alerta #B42318. Linhas e bordas: #D6DAE6.</p>'''))

# 8 contraste
def par(fg, bg, txt='Aa Sinalume'):
    return f'<span class="par" style="color:{fg};background:{bg};border:.4pt solid {BORDA}">{txt}</span>'

paginas.append(pagina(8, 'Contraste', f'''
{cabecalho('06 · Contraste e acessibilidade', 'Legível para todos', 'O Sinalume é um projeto de acessibilidade, e sua marca também precisa ser. Todas as combinações de texto seguem o padrão internacional WCAG 2.1, nível AA (contraste mínimo de 4,5:1).')}
<table>
 <tr><th>Combinação</th><th>Exemplo</th><th>Contraste</th><th>Uso</th></tr>
 <tr><td>Grafite sobre branco</td><td>{par(GRAFITE,'#fff')}</td><td>17,7 : 1</td><td class="ok">Texto principal</td></tr>
 <tr><td>Branco sobre Azul Sinalume</td><td>{par('#fff',AZUL)}</td><td>10,3 : 1</td><td class="ok">Botões, capas</td></tr>
 <tr><td>Azul Sinalume sobre branco</td><td>{par(AZUL,'#fff')}</td><td>10,3 : 1</td><td class="ok">Títulos, links</td></tr>
 <tr><td>Azul Sinalume sobre Névoa</td><td>{par(AZUL,NEVOA)}</td><td>9,7 : 1</td><td class="ok">Títulos em painéis</td></tr>
 <tr><td>Grafite sobre Âmbar</td><td>{par(GRAFITE,AMBAR)}</td><td>8,7 : 1</td><td class="ok">Selos e avisos</td></tr>
 <tr><td>Cinza Texto sobre branco</td><td>{par(CINZA,'#fff')}</td><td>7,6 : 1</td><td class="ok">Texto secundário</td></tr>
 <tr><td>Âmbar sobre Azul Sinalume</td><td>{par(AMBAR,AZUL)}</td><td>5,0 : 1</td><td class="ok">Destaques grandes</td></tr>
 <tr><td>Âmbar sobre branco</td><td>{par(AMBAR,'#fff')}</td><td>2,0 : 1</td><td class="nao">Nunca para texto</td></tr>
 <tr><td>Azul Sinalume sobre Grafite</td><td>{par(AZUL,GRAFITE)}</td><td>1,7 : 1</td><td class="nao">Nunca</td></tr>
</table>
<h2>Boas práticas</h2>
<ul>
 <li>Corpo de texto com no mínimo <b>16 px</b> em telas e <b>10 pt</b> em impressos; legendas do modo culto bem maiores.</li>
 <li>Não use cor como única forma de passar informação: junte sempre um texto ou um ícone.</li>
 <li>Em vídeos, deixe a pessoa que sinaliza bem iluminada, com mãos e rosto visíveis, sobre fundo liso.</li>
 <li>Todo vídeo de divulgação deve ter legenda em português e, sempre que possível, janela de Libras.</li>
</ul>'''))

# 9 tipografia
paginas.append(pagina(9, 'Tipografia', f'''
{cabecalho('07 · Tipografia', 'Nunito', 'Fonte gratuita e aberta (SIL Open Font License), de formas arredondadas, com a mesma família do logotipo. Disponível no Google Fonts.')}
<div class="grade2">
 <div><div class="aa">Aa</div>
  <p class="alfabeto">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 áâãàçéêíóôõú ?!@&amp;</p></div>
 <div class="pesos">
  <div><span style="font-weight:900">Black 900</span><span>Títulos de capa</span></div>
  <div><span style="font-weight:800">ExtraBold 800</span><span>Títulos e destaques</span></div>
  <div><span style="font-weight:700">Bold 700</span><span>Subtítulos e botões</span></div>
  <div><span style="font-weight:600">SemiBold 600</span><span>Rótulos</span></div>
  <div><span style="font-weight:400">Regular 400</span><span>Texto corrido</span></div>
 </div>
</div>
<h2>Hierarquia</h2>
<div class="escala">
 <div><small>Título 1 · 900 · 32 pt</small><span style="font-size:24pt;font-weight:900;color:{AZUL}">Libras para todos</span></div>
 <div><small>Título 2 · 800 · 18 pt</small><span style="font-size:16pt;font-weight:800;color:{AZUL}">Como funciona</span></div>
 <div><small>Subtítulo · 700 · 13 pt</small><span style="font-size:12pt;font-weight:700">O ouvinte fala, a pessoa surda vê</span></div>
 <div><small>Texto · 400 · 10 pt</small><span style="font-size:10pt;color:{CINZA}">O app traduz entre Libras e português direto no celular.</span></div>
 <div><small>Legenda · 600 · 8 pt</small><span style="font-size:8pt;font-weight:600;color:{CINZA};letter-spacing:.04em">FOTO: GRAVAÇÃO EM MUTIRÃO</span></div>
</div>
<div class="nota"><p><b>No aplicativo</b>, o texto usa a fonte do próprio sistema (San Francisco no iPhone, Roboto no Android) para abrir rápido em celulares simples. A Nunito fica no logotipo e nos materiais de divulgação. Na falta da Nunito, use Arial Rounded ou Arial.</p></div>'''))

# 10 voz
paginas.append(pagina(10, 'Voz e linguagem', f'''
{cabecalho('08 · Voz e linguagem', 'Como o Sinalume fala', 'Falamos como um bom vizinho que conhece Libras: simples, respeitoso e prático.')}
<div class="principios">
 <div><h3>Simples</h3><p>Frases curtas, palavras do dia a dia, um passo de cada vez. Muitas pessoas surdas leem o português como segunda língua.</p></div>
 <div><h3>Respeitosa</h3><p>A pessoa surda é protagonista, não “paciente” nem “coitada”. Libras é uma língua completa, não mímica.</p></div>
 <div><h3>Honesta</h3><p>Dizemos o que o app faz e o que ainda não faz. Ele não substitui intérpretes em situações importantes.</p></div>
</div>
<h2>Termos corretos</h2>
<div class="dupla">
 <div class="h s">Use</div><div class="h n">Evite</div>
 <div class="s">pessoa surda, comunidade surda</div><div class="n v">surdo-mudo, mudinho</div>
 <div class="s">pessoa com deficiência auditiva (quando ela preferir)</div><div class="n v">portador de deficiência</div>
 <div class="s">Libras (Língua Brasileira de Sinais)</div><div class="n v">LIBRAS, “linguagem” de sinais</div>
 <div class="s">intérprete de Libras</div><div class="n v">tradutor de mímica</div>
 <div class="s">ouvinte</div><div class="n v">pessoa normal</div>
 <div class="s">sinalizar, fazer o sinal</div><div class="n v">gesticular</div>
</div>
<h2>Escrita do nome</h2>
<p>Escreva <b>Sinalume</b>, com inicial maiúscula, em textos corridos. Nunca SINALUME, SinaLume ou Sina Lume. O logotipo, em caixa-baixa, só aparece como imagem.</p>
<h2>Comunidades cristãs</h2>
<p>Ao falar com igrejas, use linguagem acolhedora e inclusiva entre denominações (“culto”, “igreja”, “irmãos”), sem associar a marca a uma denominação específica.</p>'''))

# 11 aplicações
paginas.append(pagina(11, 'Aplicações', f'''
{cabecalho('09 · Aplicações', 'A marca no dia a dia', 'Exemplos de como combinar logotipo, cores e tipografia. Modelos editáveis podem ser pedidos pela aba Sugestões do app.')}
<div style="display:grid;grid-template-columns:72mm 1fr;gap:8mm">
 <div>
  <div class="cartaz">{logo(texto="#fff", halo=False, estilo="width:38mm")}
   <h4>Este culto tem<br>tradução em Libras</h4>
   <p>Aponte a câmera do celular para o código e acompanhe a pregação em Libras e em legenda.</p>
   <div class="qr">{qr()}</div><span class="url">ktunda.github.io<br>/sinalume</span><div class="faixa"></div></div>
  <p class="legenda">Cartaz A4 para igrejas e eventos</p>
 </div>
 <div style="display:grid;gap:6mm;align-content:start">
  <div style="display:grid;grid-template-columns:1fr 26mm;gap:5mm;align-items:start">
   <div><div class="post">{logo(estilo="width:30mm")}<h4>Grave um sinal e ajude o app a aprender.</h4><div class="ponto"></div></div>
    <p class="legenda">Post quadrado para redes sociais</p></div>
   <div>{icone(raio=0, estilo="width:26mm;border-radius:50%;display:block")}<p class="legenda">Avatar de perfil</p>
    {icone(estilo="width:14mm;display:block;margin-top:5mm")}<p class="legenda">Ícone do app</p></div>
  </div>
  <div><div class="slide"><div class="barra"></div>{logo(estilo="width:22mm")}
    <h4>Como funciona</h4><p>O ouvinte fala; a pessoa surda vê a legenda e o avatar em Libras.</p></div>
   <p class="legenda">Slide de apresentação (16:9)</p></div>
 </div>
</div>
<div class="faixa-ig">{logo(texto="#fff", halo=False, estilo="width:52mm")}<div class="sep"></div>
 <div><b>Tradução em Libras neste culto</b><span>Legenda e avatar em Libras no telão · grátis</span></div>
 <div class="qrb">{qr(escala=2)}</div></div>
<p class="legenda">Faixa horizontal para entrada de igreja ou telão (proporção 4:1)</p></div>'''))

# 12 contracapa
paginas.append(pagina(12, '', f'''
<div class="centro">
 {logo(texto="#fff", halo=False, estilo="width:90mm")}
 <p style="margin-top:10mm;font-size:11pt">Tradução entre Libras e português, grátis e de código aberto.</p>
 <p style="margin-top:14mm;font-size:9pt">App: <b style="color:#fff">ktunda.github.io/sinalume</b><br>
 Projeto: <b style="color:#fff">github.com/ktunda/sinalume</b></p>
 <p style="margin-top:14mm;font-size:8pt;color:rgba(255,255,255,.55)">Manual da Marca · versão 1.0 · novembro de 2026<br>
 Fonte Nunito sob SIL Open Font License · Marca de uso livre para divulgar o projeto, seguindo estas diretrizes.</p>
</div><div class="faixa"></div>''', 'contracapa'))

html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Sinalume — Manual da Marca</title><style>{CSS}</style></head><body>{"".join(paginas)}</body></html>'
pathlib.Path(__file__).with_name('manual-da-marca.html').write_text(html)
print('ok', len(html))
