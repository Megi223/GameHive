
const globalMiddleware = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    if ((req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register')) && req.user) {
        return res.redirect('/');
    }
    next();
}

module.exports = { globalMiddleware }