import config from '@payload-config';
import { RootLayout } from '@payloadcms/next/layouts';
import { importMap } from '../importMap';
import { handleServerFunctions } from '../serverAction';
import React from 'react';

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={handleServerFunctions}>
    {children}
  </RootLayout>
);

export default Layout;
