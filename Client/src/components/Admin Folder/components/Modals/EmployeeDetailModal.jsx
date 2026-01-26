import React from 'react';
import EmployeeDetailsView from '../EmployeeDetailsView';

export default function EmployeeDetailModal({ open, onClose, employee }) {
    if (!open || !employee) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <EmployeeDetailsView employee={employee} onClose={onClose} />
        </div>
    );
}
