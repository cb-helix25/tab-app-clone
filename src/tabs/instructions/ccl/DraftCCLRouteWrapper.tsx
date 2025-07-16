// src/tabs/instructions/ccl/DraftCCLRouteWrapper.tsx
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DraftCCLPage from './DraftCCLPage';

export default function DraftCCLRouteWrapper() {
    const { matterId } = useParams<{ matterId: string }>();
    if (!matterId) return <Navigate to="/tab" replace />;  // or your 404
    return <DraftCCLPage matterId={matterId} />;
}