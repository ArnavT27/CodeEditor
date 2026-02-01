// Dynamic API Route - Individual Project Management
import { NextResponse } from 'next/server';

// In-memory storage (same as projects/route.js - in production, use shared database)
let projects = [
    {
        id: 1,
        name: 'Hello World',
        language: 'javascript',
        code: 'console.log("Hello, World!");',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Python Calculator',
        language: 'python',
        code: 'def add(a, b):\n    return a + b\n\nresult = add(5, 3)\nprint(f"Result: {result}")',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// GET - Fetch single project by ID
export async function GET(request, { params }) {
    try {
        const id = parseInt(params.id);
        const project = projects.find(p => p.id === id);

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            project
        });

    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        );
    }
}

// PUT - Update project by ID
export async function PUT(request, { params }) {
    try {
        const id = parseInt(params.id);
        const { name, language, code } = await request.json();

        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Update project
        projects[projectIndex] = {
            ...projects[projectIndex],
            ...(name && { name: name.trim() }),
            ...(language && { language }),
            ...(code && { code }),
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            project: projects[projectIndex],
            message: 'Project updated successfully'
        });

    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        );
    }
}

// DELETE - Delete project by ID
export async function DELETE(request, { params }) {
    try {
        const id = parseInt(params.id);
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Remove project
        const deletedProject = projects.splice(projectIndex, 1)[0];

        return NextResponse.json({
            success: true,
            project: deletedProject,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        );
    }
}