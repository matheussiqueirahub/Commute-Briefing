# Commute Briefing

**Commute Briefing** é uma aplicação React moderna projetada para transformar sua lista de leitura diária em uma experiência de áudio personalizada e de alta qualidade. Desenvolvido por **Matheus Siqueira**, o projeto utiliza tecnologias avançadas de Inteligência Artificial para sintetizar notícias, posts de blog e textos em um briefing falado coeso, perfeito para o seu trajeto diário.

## 🚀 Funcionalidades

- **Resumo com IA**: Condensa inteligentemente múltiplos artigos em um roteiro suave e conversacional.
- **Voz Neural de Alta Fidelidade**: Gera fala natural e agradável para audição prolongada.
- **Personalização de Voz**: Escolha entre diversas vozes distintas (Kore, Puck, Fenrir, Charon, Zephyr).
- **Controles de Áudio**:
  - Controle de tom (pitch) em tempo real.
  - Funcionalidade de Play/Pause e busca.
  - Visualização dinâmica de áudio.
- **Gerenciamento de Fila**: Adicione, remova e gerencie artigos sem esforço.
- **Modo Auto-Update**: Funcionalidade opcional para regenerar automaticamente o briefing de áudio sempre que o conteúdo da fila for alterado.
- **Segurança e Restrições**: Limites de caracteres integrados (5.000 caracteres) e tratamento robusto de erros.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Áudio**: Web Audio API

## 📦 Instalação e Configuração

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/matheussiqueira/commute-briefing.git
   cd commute-briefing
   ```

2. **Configuração de Ambiente**
   Esta aplicação requer uma chave de API válida configurada no ambiente.
   Certifique-se de que sua variável `process.env.API_KEY` esteja definida.

3. **Rodando o App**
   Abra o `index.html` em um navegador moderno ou sirva-o usando um servidor estático local (ex: `npx serve`).

## 📄 Licença

**MIT License**

Copyright (c) 2025 **Matheus Siqueira**

A permissão é concedida, gratuitamente, a qualquer pessoa que obtenha uma cópia
deste software e dos arquivos de documentação associados (o "Software"), para lidar
com o Software sem restrições, incluindo, sem limitação, os direitos
de usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender
cópias do Software, e permitir que as pessoas a quem o Software é
fornecido o façam, sujeito às seguintes condições:

O aviso de direitos autorais acima e este aviso de permissão devem ser incluídos em todas
as cópias ou partes substanciais do Software.

O SOFTWARE É FORNECIDO "NO ESTADO EM QUE SE ENCONTRA", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU
IMPLÍCITA, INCLUINDO, MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO,
ADEQUAÇÃO A UM DETERMINADO FIM E NÃO VIOLAÇÃO. EM NENHUMA CIRCUNSTÂNCIA OS
AUTORES OU TITULARES DE DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER REIVINDICAÇÃO, DANOS OU OUTRA
RESPONSABILIDADE, SEJA EM UMA AÇÃO DE CONTRATO, ATO ILÍCITO OU DE OUTRA FORMA, DECORRENTE DE,
FORA DE OU EM CONEXÃO COM O SOFTWARE OU O USO OU OUTRAS NEGOCIAÇÕES NO
SOFTWARE.

## 👨‍💻 Autor

Desenvolvido com ❤️ por **Matheus Siqueira**.
