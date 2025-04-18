export const isAdmin = (req, res, next) => {
    if(!req.user || req.user.role !== "admin"){
        console.log("req.user role",req.user.role);
        return res.status(403).json({message: "Accès reserver au administrateur !"})
        
    }
    
    next()
}