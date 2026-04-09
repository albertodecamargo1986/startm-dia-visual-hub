
# Adicionar role super_admin ao usuário master

## Problema
O email albertodecamargo@gmail.com possui apenas as roles `customer` e `admin`. Falta a role `super_admin` que dá acesso total ao sistema.

## Alteração
- Inserir na tabela `user_roles` a role `super_admin` para o user_id correspondente ao email albertodecamargo@gmail.com
- Uma única operação de INSERT via migration
