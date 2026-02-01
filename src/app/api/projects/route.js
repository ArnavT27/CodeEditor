// API Route Handler - Project Management
import { NextResponse } from 'next/server';

// In-memory storage (in production, use a database like PostgreSQL, MongoDB, etc.)
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

let nextId = 3;

// GET - Fetch all projects
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language');

        let filteredProjects = projects;

        // Filter by language if specified
        if (language) {
            filteredProjects = projects.filter(p => p.language === language);
        }

        return NextResponse.json({
            success: true,
            projects: filteredProjects,
            total: filteredProjects.length
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        );
    }
}

// POST - Create new project
export async function POST(request) {
    try {
        const { name, language, code } = await request.json();

        // Validate input
        if (!name || !language || !code) {
            return NextResponse.json(
                { error: 'Name, language, and code are required' },
                { status: 400 }
            );
        }

        // Create new project
        const newProject = {
            id: nextId++,
            name: name.trim(),
            language,
            code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        projects.push(newProject);

        return NextResponse.json({
            success: true,
            project: newProject,
            message: 'Project created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
}

// DELETE - Delete all projects (for testing)
export async function DELETE() {
    try {
        projects = [];
        nextId = 1;

        return NextResponse.json({
            success: true,
            message: 'All projects deleted'
        });

    } catch (error) {
        console.error('Error deleting projects:', error);
        return NextResponse.json(
            { error: 'Failed to delete projects' },
            { status: 500 }
        );
    }
}