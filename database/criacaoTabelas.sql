-- Banco de dados do aplicativo Roster (geracao de escalas)
-- SGBD: PostgreSQL
-- Ordem: usuario -> escala -> (topico, participante, data_escala) -> (designacao, indisponibilidade)

-- Telas 02, 03 e 02b/03b: cadastro e login
CREATE TABLE usuario (
    id_usuario     SERIAL       PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    senha_hash     VARCHAR(255) NOT NULL,
    data_cadastro  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Telas 04, 05 e 06: escala criada por um usuario
-- salva = botao "Salvar escala"; enviada_email = copia enviada ao email do usuario (tela 06)
CREATE TABLE escala (
    id_escala         SERIAL       PRIMARY KEY,
    id_usuario        INTEGER      NOT NULL,
    titulo            VARCHAR(120) NOT NULL,
    data_criacao      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    salva             BOOLEAN      NOT NULL DEFAULT FALSE,
    enviada_email     BOOLEAN      NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- Telas 05b e 06: topicos da escala; quantidade = pessoas escaladas em cada celula; para_todos = a escala mostra apenas "Todos"
CREATE TABLE topico (
    id_topico   SERIAL       PRIMARY KEY,
    id_escala   INTEGER      NOT NULL,
    descricao   VARCHAR(100) NOT NULL,
    quantidade  INTEGER      NOT NULL DEFAULT 1,
    para_todos  BOOLEAN      NOT NULL DEFAULT FALSE,
    ordem       INTEGER      NOT NULL,
    FOREIGN KEY (id_escala) REFERENCES escala (id_escala),
    UNIQUE (id_escala, ordem),
    CHECK (quantidade >= 1)
);

-- Tela 05c: nomes das pessoas a serem escaladas
CREATE TABLE participante (
    id_participante  SERIAL       PRIMARY KEY,
    id_escala        INTEGER      NOT NULL,
    nome             VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_escala) REFERENCES escala (id_escala),
    UNIQUE (id_escala, nome)
);

-- Tela 05d: datas da escala
CREATE TABLE data_escala (
    id_data      SERIAL   PRIMARY KEY,
    id_escala    INTEGER  NOT NULL,
    data_evento  DATE     NOT NULL,
    FOREIGN KEY (id_escala) REFERENCES escala (id_escala),
    UNIQUE (id_escala, data_evento)
);

-- Tela 06: escala gerada (cada celula = topico x data, com os nomes sorteados)
CREATE TABLE designacao (
    id_designacao    SERIAL   PRIMARY KEY,
    id_topico        INTEGER  NOT NULL,
    id_data          INTEGER  NOT NULL,
    id_participante  INTEGER  NOT NULL,
    FOREIGN KEY (id_topico)       REFERENCES topico (id_topico),
    FOREIGN KEY (id_data)         REFERENCES data_escala (id_data),
    FOREIGN KEY (id_participante) REFERENCES participante (id_participante),
    UNIQUE (id_topico, id_data, id_participante)
);

-- Tela de indisponibilidades (antes de gerar): pessoa que nao pode em determinada data
CREATE TABLE indisponibilidade (
    id_indisponibilidade  SERIAL   PRIMARY KEY,
    id_participante       INTEGER  NOT NULL,
    id_data               INTEGER  NOT NULL,
    FOREIGN KEY (id_participante) REFERENCES participante (id_participante),
    FOREIGN KEY (id_data)         REFERENCES data_escala (id_data),
    UNIQUE (id_participante, id_data)
);
