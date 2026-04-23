INSERT INTO app_role (name) SELECT 'ROLE_IAM_MASTER' WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE name = 'ROLE_IAM_MASTER');

INSERT INTO user_role (user_id, role_id)
SELECT u.id, (SELECT id FROM app_role WHERE name = 'ROLE_IAM_MASTER')
FROM app_user u
WHERE EXISTS (
    SELECT 1 FROM user_role ur
    JOIN app_role ar ON ar.id = ur.role_id
    WHERE ur.user_id = u.id AND ar.name = 'ROLE_ADMIN'
)
AND NOT EXISTS (
    SELECT 1 FROM user_role ur2
    JOIN app_role ar2 ON ar2.id = ur2.role_id
    WHERE ur2.user_id = u.id AND ar2.name = 'ROLE_IAM_MASTER'
);
