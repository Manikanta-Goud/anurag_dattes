import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || 50

    // Fetch all achievements ordered by date
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .order('achievement_date', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      console.error('Error fetching achievements:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ achievements })
  } catch (error) {
    console.error('Server error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      student_name,
      achievement_title,
      description,
      achievement_date,
      sector,
      image_url,
      achievement_type,
      position,
      organization,
      created_by
    } = body

    // Validate required fields
    if (!student_name || !achievement_title || !description || !achievement_date || !sector) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert achievement
    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert([{
        student_name,
        achievement_title,
        description,
        achievement_date,
        sector,
        image_url,
        achievement_type,
        position,
        organization,
        created_by
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating achievement:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ achievement })
  } catch (error) {
    console.error('Server error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const achievementId = searchParams.get('id')

    if (!achievementId) {
      return Response.json({ error: 'Achievement ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId)

    if (error) {
      console.error('Error deleting achievement:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
