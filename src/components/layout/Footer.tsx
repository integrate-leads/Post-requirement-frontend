import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-semibold text-foreground">RecruitPro</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Simplifying recruitment with smart solutions for recruiters and job seekers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-muted-foreground hover:text-primary text-sm">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary text-sm">
                  Recruiter Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-2">
              <li className="text-muted-foreground text-sm">Post Requirements</li>
              <li className="text-muted-foreground text-sm">Resume Database</li>
              <li className="text-muted-foreground text-sm">Candidate Screening</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-muted-foreground text-sm">support@recruitpro.com</li>
              <li className="text-muted-foreground text-sm">+1 (555) 123-4567</li>
              <li className="text-muted-foreground text-sm">123 Business Street, Tech City</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} RecruitPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
