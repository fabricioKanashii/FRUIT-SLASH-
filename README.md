# FRUIT SLASH // NINJA NEON

> Transforme seu indicador em uma lâmina de energia e corte o máximo de frutas antes que o tempo acabe.

**FRUIT SLASH // NINJA NEON** é um jogo arcade desenvolvido para navegador que utiliza **visão computacional** para transformar os movimentos da mão do jogador em comandos dentro do jogo.

O jogador utiliza a câmera do computador ou dispositivo para controlar uma lâmina virtual através do movimento do dedo indicador. O objetivo é cortar o maior número possível de frutas em **20 segundos**, construir combos e alcançar a maior pontuação.

---

## Sobre o projeto

O projeto combina:

* Visão computacional
* Rastreamento de mãos
* HTML5 Canvas
* JavaScript
* Animações em tempo real
* Física de objetos
* Sistema de colisão
* Efeitos visuais neon
* Efeitos sonoros gerados pelo navegador
* Sistema de pontuação e recorde

A detecção da mão é realizada utilizando **MediaPipe Hands**.

O projeto foi pensado para experiências interativas, apresentações, eventos, ambientes educacionais e projetos de inovação que utilizem interação humano-computador.

---

## Como jogar

1. Abra o jogo no navegador.
2. Permita o acesso à câmera.
3. Posicione sua mão diante da câmera.
4. Mostre o dedo indicador.
5. Aguarde a contagem regressiva.
6. Mova o indicador rapidamente para cortar as frutas.
7. Evite as bombas.
8. Tente criar o maior combo possível.
9. Alcance a maior pontuação em 20 segundos.

### Objetivo

**Corte o máximo de frutas possível antes que o tempo acabe.**

---

## Mecânicas

### Frutas

Cada fruta possui uma pontuação diferente.

| Fruta    | Pontos |
| -------- | -----: |
| Melancia |     10 |
| Laranja  |     10 |
| Maçã     |     12 |
| Limão    |     12 |
| Abacaxi  |     15 |
| Kiwi     |     15 |
| Morango  |     18 |
| Manga    |     18 |
| Pêssego  |     20 |
| Uva      |     20 |

Quanto maior o valor da fruta, maior a recompensa ao cortá-la.

---

### Combos

Cortes consecutivos realizados dentro de uma pequena janela de tempo aumentam o combo.

O multiplicador de pontuação aumenta conforme o jogador mantém a sequência.

Exemplo:

```text
1º corte → 1x
2º corte → 1.5x
3º corte → 2x
4º corte → 2.5x
5º corte → 3x
```

O objetivo é incentivar movimentos rápidos e precisos.

---

### Bombas

As bombas devem ser evitadas.

Ao atingir uma bomba:

* O jogador perde pontos.
* O tempo da partida é reduzido.
* O combo é zerado.
* A tela recebe um efeito de impacto.
* Efeitos sonoros de explosão são reproduzidos.

Penalidades atuais:

```text
-15 pontos
-1.5 segundos
Combo zerado
```

---

## Visão computacional

O jogo utiliza **MediaPipe Hands** para detectar a mão do jogador através da câmera.

O sistema identifica os pontos da mão e utiliza principalmente o **landmark 8**, correspondente à ponta do dedo indicador.

Fluxo simplificado:

```text
             CÂMERA
                │
                ▼
         MediaPipe Hands
                │
                ▼
        Detecção da mão
                │
                ▼
       Dedo indicador (8)
                │
                ▼
       Coordenada na tela
                │
                ▼
        Trajetória da mão
                │
                ▼
        Lâmina energética
                │
                ▼
       Detecção de colisão
                │
        ┌───────┴───────┐
        ▼               ▼
      FRUTA           BOMBA
        │               │
        ▼               ▼
     PONTOS          PENALIDADE
```

---

## Tecnologias utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript ES6+
* Canvas API

### Visão computacional

* MediaPipe Hands
* Webcam API
* `getUserMedia()`

### Áudio

O projeto utiliza a **Web Audio API** para gerar efeitos sonoros diretamente no navegador.

Os efeitos incluem:

* Corte de frutas
* Combo
* Explosão
* Início da partida
* Contagem regressiva
* Contagem final

### Armazenamento

O recorde do jogador é armazenado utilizando:

```javascript
localStorage
```

Chave utilizada:

```text
fruitSlashBest
```

Dessa forma, o navegador consegue manter o maior recorde mesmo depois que a página é recarregada.

---

## Estrutura do projeto

```text
FRUIT-SLASH/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

### `index.html`

Responsável pela estrutura da aplicação.

Contém:

* Canvas do jogo
* Webcam
* HUD
* Pontuação
* Cronômetro
* Combo
* Tela inicial
* Contagem regressiva
* Tela de resultados
* Carregamento do MediaPipe

### `style.css`

Responsável pela identidade visual.

Inclui:

* Interface neon
* HUD
* Animações
* Botões
* Telas
* Responsividade
* Efeitos de brilho
* Tipografia futurista
* Layout para dispositivos menores

### `script.js`

Contém o motor principal do jogo.

Responsável por:

* Inicialização da câmera
* MediaPipe Hands
* Rastreamento do indicador
* Trajetória da lâmina
* Física das frutas
* Geração das frutas
* Bombas
* Colisões
* Corte
* Combos
* Pontuação
* Partículas
* Efeitos sonoros
* Cronômetro
* Recorde
* Loop principal do jogo

---

## Estados do jogo

O jogo possui quatro estados principais:

```javascript
MENU
COUNTDOWN
PLAYING
RESULTS
```

### MENU

Tela inicial onde o jogador ativa a câmera.

### COUNTDOWN

Contagem regressiva:

```text
3
2
1
VAI!
```

### PLAYING

Momento em que a partida acontece.

A duração padrão é:

```javascript
const ROUND_SECONDS = 20;
```

### RESULTS

Apresenta:

* Pontuação final
* Novo recorde
* Quantidade de frutas cortadas
* Melhor combo
* Quantidade de bombas atingidas

---

## Física

As frutas são lançadas a partir da parte inferior da tela e recebem velocidade vertical e horizontal.

A gravidade utilizada atualmente é:

```javascript
const GRAVITY = 1500;
```

Cada fruta possui:

* posição X/Y;
* velocidade X/Y;
* raio;
* rotação;
* velocidade de rotação;
* estado de corte;
* estado de perda.

Isso cria uma trajetória semelhante a objetos sendo lançados para o alto.

---

## Sistema de corte

O sistema armazena uma sequência de posições do indicador.

```text
P1 ───── P2 ───── P3 ───── P4
          trajetória
              ↓
           LÂMINA
              ↓
            FRUTA
```

Quando a velocidade do movimento ultrapassa o limite definido, o sistema verifica a distância entre a trajetória da lâmina e cada fruta.

A função principal responsável pela detecção é:

```javascript
checkSlices()
```

A distância entre o segmento da trajetória e a fruta é calculada através de:

```javascript
pointSegDist()
```

Quando a distância é suficientemente pequena, a fruta é considerada cortada.

---

## Efeitos visuais

O jogo possui diversos efeitos para aumentar a sensação de impacto:

* Partículas neon
* Brilho da lâmina
* Retículo do indicador
* Esqueleto da mão
* Scanlines
* Grid futurista
* Vignette
* Screen shake
* Flash vermelho para bombas
* Popups de pontuação
* Animação de combo

A estética foi construída em torno de uma identidade:

```text
CYBERPUNK
+
ARCADE
+
NINJA
+
VISÃO COMPUTACIONAL
```

---

## Requisitos

Para executar o projeto, recomenda-se:

* Navegador moderno;
* Webcam;
* JavaScript habilitado;
* Conexão com a internet para carregar o MediaPipe e as fontes externas;
* Ambiente com permissão para utilização da câmera.

Navegadores recomendados:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox

---

## Executando o projeto

### Opção 1 — Servidor local

Recomenda-se executar o projeto através de um servidor HTTP local.

Por exemplo, utilizando Python:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

### Opção 2 — VS Code

Caso esteja utilizando o Visual Studio Code, pode ser utilizado o **Live Server** para executar o projeto.

Abra:

```text
index.html
```

e execute através do servidor local.

---

## Permissão da câmera

Na primeira execução, o navegador solicitará acesso à câmera.

Selecione:

**Permitir**

Sem acesso à câmera, o sistema de visão computacional não poderá identificar o movimento da mão.

---

## Performance

Como o jogo utiliza processamento de imagem em tempo real, a performance pode variar de acordo com:

* Processador;
* GPU;
* Resolução da webcam;
* Navegador;
* Iluminação do ambiente;
* Quantidade de objetos na tela.

Para obter melhores resultados:

* Utilize boa iluminação;
* Mantenha a mão visível;
* Evite fundos muito escuros ou extremamente complexos;
* Posicione a câmera de maneira estável;
* Mantenha distância suficiente para que a mão apareça completamente.


### V1 — Protótipo

* [x] Interface neon
* [x] Webcam
* [x] MediaPipe Hands
* [x] Rastreamento do indicador
* [x] Frutas
* [x] Bombas
* [x] Pontuação
* [x] Combo
* [x] Cronômetro
* [x] Recorde local
* [x] Efeitos sonoros
* [x] Partículas

### V2 — Arcade

* [ ] Corte visual real das frutas
* [ ] Sistema de dificuldade progressiva
* [ ] Frenzy Mode
* [ ] Combos avançados
* [ ] Feedback visual de velocidade
* [ ] Mais efeitos de impacto
* [ ] Melhor detecção de colisão
* [ ] Otimização do MediaPipe

### V3 — Experiência

* [ ] Ranking
* [ ] Sistema de níveis
* [ ] Novos modos de jogo
* [ ] Novos personagens
* [ ] Sistema de conquistas
* [ ] Música dinâmica
* [ ] Personalização da lâmina

### V4 — Visão computacional avançada

* [ ] Reconhecimento de múltiplos gestos
* [ ] Duas mãos
* [ ] Ataques especiais
* [ ] Sistema de defesa
* [ ] Interação corporal completa
* [ ] Experiência multiplayer

---

## Autor

**Fabricio Kanashii**

### Contato

* **Instagram:** [@fabricio_kanashii](https://instagram.com/fabricio_kanashii)
* **WhatsApp:** [(85) 99295-4741](https://wa.me/5585992954741)
