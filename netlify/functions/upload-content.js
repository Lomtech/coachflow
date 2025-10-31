
// Handle content upload metadata (actual file upload happens client-side to Supabase Storage)

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { coachId, tierId, title, fileUrl, fileType } = JSON.parse(event.body);

    if (!coachId || !title || !fileUrl || !fileType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Save content metadata to database
    const { data, error } = await supabase
      .from('content')
      .insert({
        coach_id: coachId,
        tier_id: tierId,
        title,
        file_url: fileUrl,
        file_type: fileType
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving content metadata:', error);
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: data })
    };
  } catch (error) {
    console.error('Error uploading content:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
