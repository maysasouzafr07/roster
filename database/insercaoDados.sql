-- Dados de teste do aplicativo Roster (PostgreSQL)
-- Execute logo apos criacaoTabelas.sql. Ordem de dependencia respeitada.

INSERT INTO usuario (id_usuario, nome, email, senha_hash, data_cadastro) VALUES
    (1, 'Maysa Souza', 'maysa.souza@email.com', '$2b$10$Kq1xN8vR2mZpL5tY7uWcOeH3dFgJ9aBsXvC4nMiEoPlQrTyUwZk1S', '2026-08-03 09:15:00'),
    (2, 'Renato Gomide', 'renato.gomide@email.com', '$2b$10$Hd7yT3wQ9nXcV1bLpA5mUeR8sJkF2gZoYiN6tCvBxMaPlEqWuDr4O', '2026-08-05 14:30:00'),
    (3, 'Camila Ferreira', 'camila.ferreira@email.com', '$2b$10$Zp4nB6vL1xQeT8mWcY3uOhK7sRdJ5aFgXiN2tCoMyPlAqUwEbVr9G', '2026-08-10 08:45:00'),
    (4, 'Lucas Oliveira', 'lucas.oliveira@email.com', '$2b$10$Tm9cV2xN5bQpL7wYeA1uOhR4sKdJ8gFzXiN3tCoMyPlBqUaEwDr6H', '2026-09-01 19:20:00'),
    (5, 'Beatriz Santos', 'beatriz.santos@email.com', '$2b$10$Wn3yL8vQ6xTcB2mZpA9uOeH5sRdJ1kFgXiN7tCoMaPlEqUyDbVr4J', '2026-09-14 11:05:00');

-- id_usuario abaixo usa somente chaves inseridas em usuario (1 a 4)
INSERT INTO escala (id_escala, id_usuario, titulo, data_criacao, salva, enviada_email) VALUES
    (1, 1, 'Limpeza da Sala', '2026-10-01 10:00:00', TRUE, TRUE),
    (2, 1, 'Apresentacao de Seminarios', '2026-10-05 15:40:00', TRUE, FALSE),
    (3, 2, 'Escala da Cozinha', '2026-10-12 09:10:00', TRUE, TRUE),
    (4, 3, 'Equipe de Louvor', '2026-10-20 20:00:00', TRUE, FALSE),
    (5, 4, 'Plantao do Laboratorio', '2026-11-02 13:25:00', FALSE, FALSE);

-- id_escala abaixo usa somente chaves inseridas em escala (1 a 5)
INSERT INTO topico (id_topico, id_escala, descricao, quantidade, para_todos, ordem) VALUES
    (1, 1, 'Varrer o chao', 1, FALSE, 1),
    (2, 1, 'Limpar a lousa', 1, FALSE, 2),
    (3, 1, 'Arrumar as cadeiras', 1, TRUE, 3),
    (4, 2, 'Introducao', 1, FALSE, 1),
    (5, 2, 'Desenvolvimento', 1, FALSE, 2),
    (6, 2, 'Conclusao', 1, TRUE, 3),
    (7, 3, 'Almoco', 2, FALSE, 1),
    (8, 3, 'Lavar a louca', 1, TRUE, 2),
    (9, 4, 'Abertura', 1, TRUE, 1),
    (10, 4, 'Instrumentos', 2, FALSE, 2),
    (11, 5, 'Atendimento', 1, FALSE, 1),
    (12, 5, 'Manutencao dos equipamentos', 1, TRUE, 2);

INSERT INTO participante (id_participante, id_escala, nome) VALUES
    (1, 1, 'Ana Souza'),
    (2, 1, 'Bruno Martins'),
    (3, 1, 'Carla Dias'),
    (4, 1, 'Diego Alves'),
    (5, 1, 'Elisa Rocha'),
    (6, 2, 'Felipe Costa'),
    (7, 2, 'Gabriela Lima'),
    (8, 2, 'Henrique Prado'),
    (9, 3, 'Isabela Nunes'),
    (10, 3, 'Joao Pereira'),
    (11, 3, 'Karina Melo'),
    (12, 3, 'Leandro Cruz'),
    (13, 4, 'Mariana Teixeira'),
    (14, 4, 'Nicolas Barros'),
    (15, 4, 'Olivia Ramos'),
    (16, 4, 'Paulo Henrique'),
    (17, 5, 'Rafaela Moura'),
    (18, 5, 'Samuel Duarte'),
    (19, 5, 'Tatiane Lopes'),
    (20, 2, 'Igor Fonseca'),
    (21, 2, 'Julia Andrade');

INSERT INTO data_escala (id_data, id_escala, data_evento) VALUES
    (1, 1, '2026-10-05'),
    (2, 1, '2026-10-12'),
    (3, 1, '2026-10-19'),
    (4, 2, '2026-10-26'),
    (5, 2, '2026-11-09'),
    (6, 2, '2026-11-16'),
    (7, 3, '2026-10-24'),
    (8, 3, '2026-10-25'),
    (9, 4, '2026-11-01'),
    (10, 4, '2026-11-08'),
    (11, 5, '2026-11-23'),
    (12, 5, '2026-11-30');

-- cada designacao usa topico, data e participante da MESMA escala; topicos com para_todos = TRUE nao tem designacao
INSERT INTO designacao (id_designacao, id_topico, id_data, id_participante) VALUES
    (1, 1, 1, 1),
    (2, 2, 1, 3),
    (3, 1, 2, 2),
    (4, 2, 2, 5),
    (5, 1, 3, 4),
    (6, 2, 3, 3),
    (7, 4, 4, 8),
    (8, 5, 4, 7),
    (9, 4, 5, 21),
    (10, 5, 5, 6),
    (11, 4, 6, 20),
    (12, 5, 6, 8),
    (13, 7, 7, 12),
    (14, 7, 7, 11),
    (15, 7, 8, 10),
    (16, 7, 8, 9),
    (17, 10, 9, 16),
    (18, 10, 9, 15),
    (19, 10, 10, 13),
    (20, 10, 10, 14),
    (21, 11, 11, 19),
    (22, 11, 12, 18);

-- indisponibilidade: pessoa e data da MESMA escala; a pessoa nao e escalada nessa data
INSERT INTO indisponibilidade (id_indisponibilidade, id_participante, id_data) VALUES
    (1, 2, 1),
    (2, 5, 3),
    (3, 10, 7),
    (4, 12, 8),
    (5, 14, 9),
    (6, 16, 10),
    (7, 18, 11),
    (8, 19, 12);

-- Reinicio das sequencias (maior id ja usado em cada tabela)
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'),
              (SELECT MAX(id_usuario) FROM usuario));

SELECT setval(pg_get_serial_sequence('escala', 'id_escala'),
              (SELECT MAX(id_escala) FROM escala));

SELECT setval(pg_get_serial_sequence('topico', 'id_topico'),
              (SELECT MAX(id_topico) FROM topico));

SELECT setval(pg_get_serial_sequence('participante', 'id_participante'),
              (SELECT MAX(id_participante) FROM participante));

SELECT setval(pg_get_serial_sequence('data_escala', 'id_data'),
              (SELECT MAX(id_data) FROM data_escala));

SELECT setval(pg_get_serial_sequence('designacao', 'id_designacao'),
              (SELECT MAX(id_designacao) FROM designacao));

SELECT setval(pg_get_serial_sequence('indisponibilidade', 'id_indisponibilidade'),
              (SELECT MAX(id_indisponibilidade) FROM indisponibilidade));
