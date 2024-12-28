
const globalMiddleware = (req, res, next) => {
    const isAuthenticated = req.cookies?.user_id ? true : false;
    res.locals.isAuthenticated = isAuthenticated;
    res.locals.userID = req.cookies?.user_id ? req.cookies?.user_id : undefined
    if (!req.user) {
        return next();
    }
    if ((req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register')) && req.user) {
        return res.redirect('/');
    }
    next();
}

module.exports = { globalMiddleware }