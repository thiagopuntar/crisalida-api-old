module.exports = function(...roles) {
    return function(req, res, next) {
        const userPermissions = req.token.company.permissions;

        const authorized = roles.some(role => {
            return userPermissions.some(permission => permission === role);
        })

        if (authorized) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'Usuário não tem permissão para acessar esse recurso'
            });
        }
    }
}