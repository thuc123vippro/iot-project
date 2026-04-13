import React from 'react';
import { FaFilePdf, FaBook, FaGithub } from 'react-icons/fa';
import { SiFigma } from 'react-icons/si';
import './Profile.css';

const links = [
  {
    id: 'report',
    title: 'Report PDF',
    href: 'https://docs.google.com/document/d/1bmwKxajpFCU9om8gz0EmbwypiBpfFK0ETubv2ahXNfo/edit?usp=sharing',
    icon: FaFilePdf,
    iconClassName: 'icon-report'
  },
  {
    id: 'docs',
    title: 'API Docs',
    href: 'http://localhost:3001/api-docs/',
    icon: FaBook,
    iconClassName: 'icon-docs'
  },
  {
    id: 'github',
    title: 'Github',
    href: 'https://github.com/thuc123vippro/iot-project.git',
    icon: FaGithub,
    iconClassName: 'icon-github'
  },
  {
    id: 'figma',
    title: 'Figma',
    href: 'https://www.figma.com/design/ThPQGq7wjE57ZwYm2ZK75N/Untitled?node-id=0-1&t=UEsTVE8f9PB8CEuB-1',
    icon: SiFigma,
    iconClassName: 'icon-figma'
  }
];

const Profile = () => {
  return (
    <section className="profile-page">
      <div className="profile-shell">
        <div className="profile-header-card">
          <img
            className="profile-avatar"
            src="https://res.cloudinary.com/dom8lim78/image/upload/v1774245598/ava_nd6b2k.jpg"
            alt="Profile avatar"
          />

          <div className="profile-info">
            <h2>NGUYEN PHAM VAN THUC</h2>
            <p>B22DCPT277</p>
          </div>
        </div>

        <div className="profile-link-list">
          {links.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.id}
                className="profile-link-item"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className={`profile-link-icon ${item.iconClassName}`}>
                  <Icon size={28} />
                </span>
                <span className="profile-link-title">{item.title}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Profile;
