import {Link} from "react-router";
import ThemeToggle from "~/components/ThemeToggle";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link className="" to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link to="/upload" className="primary-button w-fit">Upload Resume</Link>
            </div>
        </nav>
    )
}
export default Navbar
