module.exports= (req, res, next) => {
  if(!req.session.isLogedIn){
    // res.status(401);     // overwritten by 302 of redirect after it 
    res.redirect('/login');
  }else{
    next();
  }
};