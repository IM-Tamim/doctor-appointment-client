import { FaGithub, FaFacebook, FaLinkedin, FaEnvelope, FaPhone } from "react-icons/fa";
import Logo from "./Logo";

const Footer = () => {
    return (
        <footer className="bg-base-200 text-base-content border-t border-base-300 mt-auto safe-bottom safe-x">
            <div className="max-w-7xl mx-auto px-6 py-12">

                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 text-center sm:text-left lg:justify-items-center">

                    <div className="space-y-4 flex flex-col items-center sm:items-start">
                        <div className="flex items-center justify-center gap-2">
                            <Logo size={32} className="shrink-0" />
                            <h2 className="text-2xl font-black tracking-tight leading-none">
                                <span className="text-base-content">Doc</span>
                                <span className="text-primary">Appoint</span>
                            </h2>
                        </div>
                        <p className="text-sm text-base-content/60 leading-relaxed max-w-sm">
                            Your health, our priority. Book instantly.
                        </p>
                        <div className="w-40 h-0.5 rounded-full bg-gradient-to-r from-primary to-secondary opacity-60"></div>
                    </div>

                    <div className="space-y-4 flex flex-col items-center sm:items-start">
                        <h3 className="text-xs font-semibold tracking-widest uppercase text-primary">
                            Follow Us
                        </h3>
                        <div className="flex gap-4">
                            {[
                                { href: "https://github.com", icon: FaGithub, label: "GitHub" },
                                { href: "https://facebook.com", icon: FaFacebook, label: "Facebook" },
                                { href: "https://linkedin.com", icon: FaLinkedin, label: "LinkedIn" },
                            ].map(({ href, icon: Icon, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="w-10 h-10 rounded-full bg-base-300 border border-base-300 flex items-center justify-center text-base-content/60 hover:text-white hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-300"
                                >
                                    <Icon size={17} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col items-center sm:items-start">
                        <h3 className="text-xs font-semibold tracking-widest uppercase text-primary">
                            Contact Us
                        </h3>
                        <div className="space-y-3">
                            {[
                                { icon: FaEnvelope, text: "support@docappoint.com" },
                                { icon: FaPhone, text: "+880 1628110902" },
                            ].map(({ icon: Icon, text }) => (
                                <p key={text} className="flex items-center gap-3 text-sm text-base-content/60 justify-center sm:justify-start group">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Icon className="text-primary text-sm" />
                                    </span>
                                    <span>{text}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative my-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-base-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-base-200 px-4 flex items-center gap-1.5" aria-hidden="true">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/25" />
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-around items-center gap-4 text-center">
                    <p className="text-xs text-base-content/40">
                        © {new Date().getFullYear()} DocAppoint. All rights reserved.
                    </p>
                    <div className="flex gap-1 items-center">
                        <span className="text-xs text-base-content/40">Created by</span>
                        <span className="text-xs font-bold text-gradient">IMT</span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;