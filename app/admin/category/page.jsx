"use client";
import React from 'react';

const CategoryPage = () => {
    return (
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Category Management</h1>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Category Name</th>
                        <th className="py-2 px-4 border-b">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2 px-4 border-b">Sample Category</td>
                        <td className="py-2 px-4 border-b">
                            <button className="bg-blue-500 text-white px-4 py-1 rounded">Edit</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default CategoryPage;