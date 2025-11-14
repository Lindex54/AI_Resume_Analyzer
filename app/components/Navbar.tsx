import {Link} from "react-router";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link className="" to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <Link className="primary-button w-fit" to="/upload">Upload Resume</Link>
        </nav>
    )
}
export default Navbar
