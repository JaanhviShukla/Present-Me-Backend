const jwt = require("jsonwebtoken");


const userAuth = (req,res,next)=>{
  try{
    //get token from cookie or AUTHORIZATION OF HEADER
    const token = req.cokkies.token || req.header("Authorization").replace("Bearer ","");
    if (!token){
      return res.status(401).json({message:"No auth token, access denied"});

    }

    //VERIFY TOKEN
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = decoded; //attach user info to request object
    next(); //proceed to next middleware or route handler
  }catch(err){
    console.error("Auth error : ",err);
    res.status(401).json({message:"Invalid or expired token"});
  }
};


module.exports = userAuth;