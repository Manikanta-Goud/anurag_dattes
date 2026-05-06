import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        profile_id,
        title,
        description,
        repo_url,
        demo_url,
        tags,
        created_at,
        profiles (
          id,
          name,
          profile_picture,
          branch,
          year
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match frontend expectations
    const formattedProjects = projects.map(p => ({
      id: p.id,
      profile_id: p.profile_id,
      achievement_title: p.title,
      description: p.description,
      repo_url: p.repo_url,
      demo_url: p.demo_url,
      sector: p.tags,
      achievement_date: p.created_at,
      student_name: p.profiles?.name || 'Anonymous',
      image_url: p.profiles?.profile_picture || null,
      profile: p.profiles
    }));

    return NextResponse.json({ projects: formattedProjects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.profile_id || !data.title || !data.repo_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: newProject, error } = await supabaseAdmin
      .from('projects')
      .insert([
        {
          profile_id: data.profile_id,
          title: data.title,
          description: data.description,
          repo_url: data.repo_url,
          demo_url: data.demo_url,
          tags: data.tags
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.profile_id || !data.title || !data.repo_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: updatedProject, error } = await supabaseAdmin
      .from('projects')
      .update({
        title: data.title,
        description: data.description,
        repo_url: data.repo_url,
        demo_url: data.demo_url,
        tags: data.tags
      })
      .eq('id', data.id)
      .eq('profile_id', data.profile_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project: updatedProject }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const profile_id = searchParams.get('profile_id');
    
    if (!id || !profile_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('profile_id', profile_id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
