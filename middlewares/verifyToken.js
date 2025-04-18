import jwt from "jsonwebtoken"
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({ message: "Token manquant" })
    }
    const token= authHeader.split(" ")[1]
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_KEY)
        req.user = decodedToken
        next()
    } catch (error) {
        console.error(error)
        if (error.name === "TokenExpiredError"){
            return res.status(401).json({ message: "Votre session est expirée veuillez vous reconnecter" })
        }
        return res.status(403).json({ message: "Token non valable ou introuvable" })
    }
    }