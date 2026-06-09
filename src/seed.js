import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import { Resource } from './models/Resource.js';
import { Privilege } from './models/Privilege.js';
import { Role } from './models/Role.js';
import { User } from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nss-backend';

const seedDatabase = async () => {
  try {
    // 1. Connect
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 2. Clear existing data
    console.log('Clearing old collections...');
    await Resource.deleteMany({});
    await Privilege.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});
    console.log('Collections cleared.');

    // 3. Create Resources
    console.log('Creating resources...');
    const resourceNames = ['Program_Unit', 'Users', 'Rollout', 'Mediacorner', 'RBAC'];
    const resources = [];
    for (const name of resourceNames) {
      const res = await Resource.create({
        name,
        description: `${name} system management resource`
      });
      resources.push(res);
    }
    console.log('Resources created.');

    // 4. Create Privileges (CRUD)
    console.log('Creating privileges...');
    const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    const privileges = [];
    for (const res of resources) {
      for (const action of actions) {
        const priv = await Privilege.create({
          name: `${action}_${res.name.toUpperCase()}`,
          resource: res._id,
          action,
          description: `Can ${action.toLowerCase()} resource ${res.name}`
        });
        privileges.push(priv);
      }
    }
    console.log('Privileges created.');

    // 5. Create Roles (giving all privileges to all roles)
    console.log('Creating roles...');
    const roleNames = [
      'Porgram_unit_coordinator',
      'NSS_Admin',
      'NSS_User',
      'PMU_Admin',
      'PMU_User',
      'Superadmin'
    ];

    const privilegeIds = privileges.map(p => p._id);
    const roles = [];

    for (const name of roleNames) {
      const description = name === 'Superadmin'
        ? 'Super Administrator with ultimate bypass privileges'
        : `Role representing ${name} with full access.`;

      const role = await Role.create({
        name,
        description,
        privileges: privilegeIds
      });
      roles.push(role);
    }
    console.log('Roles created.');

    // 6. Create Users
    console.log('Creating default users...');
    const userSeedData = [
      { email: 'coordinator@nss.com', roleName: 'Porgram_unit_coordinator' },
      { email: 'nssadmin@nss.com', roleName: 'NSS_Admin' },
      { email: 'nssuser@nss.com', roleName: 'NSS_User' },
      { email: 'pmuadmin@nss.com', roleName: 'PMU_Admin' },
      { email: 'pmuuser@nss.com', roleName: 'PMU_User' },
      { email: 'superadmin@nss.com', roleName: 'Superadmin' }
    ];

    for (const u of userSeedData) {
      const roleObj = roles.find(r => r.name === u.roleName);
      await User.create({
        email: u.email,
        password: 'Password123!',
        role_id: roleObj._id
      });
    }

    console.log('--------------------------------------------------');
    console.log('Seeding completed successfully!');
    console.log('Default credentials (password is Password123!):');
    userSeedData.forEach(u => {
      console.log(`- ${u.roleName}: ${u.email}`);
    });
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
