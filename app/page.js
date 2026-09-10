RETURN ONLY THE HTML.
NO EXPLANATION.
NO MARKDOWN.
`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: buildRequest,
          system: MODES.app.system,
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const html = data.reply.trim();
        setGeneratedHtml(html);
        setShowPreview(true);

        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              "✅ App built successfully!\n\nYou can now preview it below or copy the full HTML.",
          },
        ]);
      } else {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              data.error ||
              "⚠️ Failed to build the app. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "⚠️ Something went wrong while building the app.\n\nPlease try again.",
        },
      ]);
    } finally {
      setBuilding(false);
      setLoading(false);
    }
  }

  // ... rest of your component (return JSX, etc.) must also be present