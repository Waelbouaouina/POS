'use server'

import config from '@payload-config'
import { handleServerFunctions as payloadHandleServerFunctions } from '@payloadcms/next/layouts'
import { logout as payloadLogout } from '@payloadcms/next/auth'

export const handleServerFunctions = async (args: any) =>
  payloadHandleServerFunctions({
    ...args,
    config,
  })

export const logout = async () =>
  payloadLogout({
    config,
  })
