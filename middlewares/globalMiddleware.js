
const globalMiddleware = (req, res, next) => {
    const isAuthenticated = req.cookies?.user_id ? true : false;
    res.locals.isAuthenticated = isAuthenticated;
    res.locals.userID = req.cookies?.user_id ? req.cookies?.user_id : undefined

    const publicRoutes = ['/', '/auth/login', '/auth/register'];

    if (req.user && (req.path === '/auth/login' || req.path === '/auth/register')) {
        return res.redirect('/');
    }

    if (!req.user && !publicRoutes.includes(req.path)) {
        return res.redirect('/auth/login');
    }
    
    next();
}

module.exports = { globalMiddleware }