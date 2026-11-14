"""Elementos compartilhados da marca Sinalume (logo, cores, fonte)."""
import base64, re, pathlib, segno

RAIZ = pathlib.Path('' + str(pathlib.Path(__file__).resolve().parents[1]) + '')
FONTE = pathlib.Path(__file__).with_name('fonts') / ('fontsource-variable-nunito-5.3.0/files/nunito-latin-wght-normal.woff2')
FONTE_EXT = pathlib.Path(__file__).with_name('fonts') / ('fontsource-variable-nunito-5.3.0/files/nunito-latin-ext-wght-normal.woff2')

AZUL = '#1B3A8C'
PROFUNDO = '#122A66'
AMBAR = '#F4A51C'
NEVOA = '#F6F7FB'
GRAFITE = '#111827'
CINZA = '#4B5563'
BORDA = '#D6DAE6'
BRANCO = '#FFFFFF'

_logo = (RAIZ / 'sinalume-logo.svg').read_text()
LOGO_PATH = re.search(r'<path d="([^"]+)"', _logo).group(1)
_icone = (RAIZ / 'sinalume-icone.svg').read_text()
ICONE_PATH = re.search(r'<path d="([^"]+)"', _icone).group(1)

# caixa justa do logotipo (sem a margem do arquivo original)
LOGO_VB = '0 -180 856 184'


def logo(texto=AZUL, ponto=AMBAR, halo=True, vb=LOGO_VB, estilo='', cls='logo'):
    h = (f'<circle cx="125.10" cy="-133.31" r="44.76" fill="{ponto}" opacity="0.18"/>' if halo else '')
    return (f'<svg class="{cls}" style="{estilo}" xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Sinalume">'
            f'<path d="{LOGO_PATH}" fill="{texto}"/>{h}'
            f'<circle cx="125.10" cy="-133.31" r="23.56" fill="{ponto}"/></svg>')


def icone(fundo=AZUL, letra=BRANCO, ponto=AMBAR, raio=112, estilo='', cls='icone'):
    return (f'<svg class="{cls}" style="{estilo}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Sinalume">'
            f'<rect width="512" height="512" rx="{raio}" fill="{fundo}"/>'
            f'<path d="{ICONE_PATH}" fill="{letra}"/>'
            f'<circle cx="331.24" cy="175.84" r="40" fill="{ponto}"/></svg>')


def qr(url='https://ktunda.github.io/sinalume/', cor=AZUL, escala=3):
    q = segno.make(url, error='m')
    return q.svg_inline(dark=cor, light=None, scale=escala, border=0)


def fontes_css():
    b = base64.b64encode(FONTE.read_bytes()).decode()
    e = base64.b64encode(FONTE_EXT.read_bytes()).decode()
    return (
        "@font-face{font-family:'Nunito';font-weight:200 1000;font-style:normal;"
        f"src:url(data:font/woff2;base64,{b}) format('woff2');"
        "unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}"
        "@font-face{font-family:'Nunito';font-weight:200 1000;font-style:normal;"
        f"src:url(data:font/woff2;base64,{e}) format('woff2');"
        "unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}"
    )
