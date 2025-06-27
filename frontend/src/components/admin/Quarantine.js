
import React from 'react';

const Quarantine = () => {
    return (
        <div>
            <h2>Quarantined Files</h2>
            <p>Files that are infected will be listed here. You can release or delete them.</p>
            {/* Placeholder for quarantined files table */}
            <table>
                <thead>
                    <tr>
                        <th>Filename</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Example row */}
                    <tr>
                        <td>infected_file.exe</td>
                        <td>INFECTED</td>
                        <td>2025-06-26</td>
                        <td>
                            <button>Release</button>
                            <button>Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Quarantine;
